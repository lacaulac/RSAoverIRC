const irc = require('irc');
const NodeRSA = require('node-rsa');
const b64 = require('js-base64').Base64;

const stdin = process.stdin;

const RSA_KEYPAIR_SIZE = 512;
const CHANNEL = "#rsaoverirc";
const NAME = "rsatests";

var keys = new Map();

function sendMyPubKey(client, key)
{
    client.say(CHANNEL, `KEY: ${b64.btoa(key.exportKey("public"))}`);
}

console.log(`[BOOTING] Generating a ${RSA_KEYPAIR_SIZE}-bits RSA keypair`);

const key = new NodeRSA({
    b: RSA_KEYPAIR_SIZE
});

console.log("[BOOTING] Done generating. Connecting...");

var client = new irc.Client("irc.epiknet.org", NAME, {
    channels: [CHANNEL]
});

client.addListener('message', (from, to, message) => {
    if(message.indexOf("KEY: ") != -1)
    {
        let keyPemString = message.split('KEY: ')[1];
        let newKey = new NodeRSA(b64.atob(keyPemString));
        keys.set(from, newKey);
        console.log(`Added ${from}'s key to the list.`);

        //Let's say hello!
        let newMessage = newKey.encrypt(`Hello! My name is ${NAME}`, "base64");
        client.say(from, `MSG: ${newMessage}`);
    }
    else if(message.indexOf('REQKEYS') != -1)
    {
        console.log(`Received a key request from ${from}. Sending the pubkey!`);
        sendMyPubKey(client, key);
    }
    else if(message.indexOf('MSG: ') != -1)
    {
        let cipheredMsg = message.split('MSG: ')[1];
        let msg = key.decrypt(cipheredMsg, "base64");
        console.log(`[Message ${from} => ${to}] ${b64.atob(msg)}`);
    }
    else
    {
        console.log(`[Unencrypted Message: ${from} => ${to}] ${message}`);
    }
});
client.addListener('error', function(message) {
    console.log('error: ', message);
    client.say("lacaulac", `I got this error message: ${message}`);
});
client.addListener("registered", () => {

    client.join(CHANNEL, () => {
        console.log("[BOOTING] Connected. Sending public key request...");

        client.say(CHANNEL, "REQKEYS");
    
        console.log("[BOOTING] Sent a key request. Now sending my key...");
    
        client.say(CHANNEL, `KEY: ${b64.btoa(key.exportKey("public"))}`);
    
        console.log("[BOOTING] Public key sent. Ready for interaction...");

        stdin.addListener("data", (rawData) => {
            let spl = rawData.toString().split(":");
            let dest = spl[0];
            let msg = spl[1];
            let finalMsg = "";
            if(keys.has(dest))
            {
                //Do the encryption
                finalMsg = "MSG: " + keys.get(dest).encrypt(msg, "base64");
                console.log(`[Message ${NAME} => ${dest}] ${msg}`);
            }
            else
            {
                finalMsg = msg;
            }
            client.say(dest, finalMsg);
        });
    });

    
});