const irc = require('irc');
const NodeRSA = require('node-rsa');
const b64 = require('js-base64').Base64;
const fs = require('fs');
const path = require('path');

const stdin = process.stdin;

const dirName = appDirectory = require('path').dirname(process.pkg ? process.execPath : (require.main ? require.main.filename : process.argv[0]));

const args = require('args');

args
    .option("host", "The IRC server address", "irc.epiknet.org")
    .option("port", "The IRC server port (currently unused)")
    .option("nickname", "The desired nickname", "rsaoverirc")
    .option("channel", "The broadcast channel", "#rsaoverirc")
    .option("keypair", "The keypair path", path.join(dirName, "keypair.pem"))

const flags = args.parse(process.argv);

const RSA_KEYPAIR_SIZE = 1024;
const CHANNEL = flags.channel;
const NAME = flags.nickname;
const HOSTNAME = flags.host;


const KEY_PATH = flags.keypair;

var keys = new Map();

function sendMyPubKey(client, key)
{
    client.say(CHANNEL, `KEY: ${b64.btoa(key.exportKey("public"))}`);
    //client.say(CHANNEL, `KEY: ${key.exportKey("public").split('\n').join('')}`);
}

function loadMyKeyPair()
{
    console.log(`[BOOTING][KEYS] Trying to load key from ${KEY_PATH}...`);
    let keyAlreadyExists = fs.existsSync(KEY_PATH);
    if(keyAlreadyExists)
    {
        console.log(`[BOOTING][KEYS] Found the keys at ${KEY_PATH}...`);
        return new NodeRSA(fs.readFileSync(KEY_PATH));
    }
    else
    {
        console.log(`[BOOTING][KEYS] couldn't find the keys at ${KEY_PATH}, generating...`);
        let k = new NodeRSA({
            b: RSA_KEYPAIR_SIZE
        });
        fs.writeFileSync(KEY_PATH, k.exportKey());
        return k;
    }
}

console.log(`[BOOTING] Generating a ${RSA_KEYPAIR_SIZE}-bits RSA keypair`);

const key = loadMyKeyPair();

console.log("[BOOTING] Done generating. Connecting...");

var client = new irc.Client(HOSTNAME, NAME, {
    channels: [CHANNEL]
});

client.addListener('message', (from, to, message) => {
    if(message.indexOf("KEY: ") != -1)
    {
        let keyPemString = message.split('KEY: ')[1];
        let newKey = new NodeRSA(b64.atob(keyPemString));
        //let newKey = new NodeRSA(keyPemString);
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