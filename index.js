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
    .option("debug", "Should we print unnecessary information?", false)

const flags = args.parse(process.argv);

const RSA_KEYPAIR_SIZE = 1024;
const CHANNEL = flags.channel;
const NAME = flags.nickname;
const HOSTNAME = flags.host;
const IS_DEBUG = flags.debug;


const KEY_PATH = flags.keypair;

var keys = new Map();

function sendMyPubKey(client, key)
{
    let tmpKey = b64.btoa(key.exportKey("public"));
    if(IS_DEBUG)
        console.log(`[KEYS] Emitting our key of length ${tmpKey.length}`);
    client.say(CHANNEL, `KEY: ${tmpKey}`);
    //client.say(CHANNEL, `KEY: ${key.exportKey("public").split('\n').join('')}`);
}

function sendMessage(client, dest, msg)
{
    let finalMsg = "MSG: " + keys.get(dest).encrypt(msg, "base64");
    console.log(`[Message ${NAME} => ${dest}] ${msg}`);
    client.say(dest, finalMsg);
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
        console.log(`[BOOTING][KEYS] couldn't find the keys at ${KEY_PATH}, generating a ${RSA_KEYPAIR_SIZE}-bits RSA keypair...`);
        let k = new NodeRSA({
            b: RSA_KEYPAIR_SIZE
        });
        fs.writeFileSync(KEY_PATH, k.exportKey());
        console.log(`[BOOTING][KEYS] Done generating keys.`);
        return k;
    }
}

const key = loadMyKeyPair();

console.log("[BOOTING] Done loading keys. Connecting...");

var client = new irc.Client(HOSTNAME, NAME, {
    channels: [CHANNEL]
});

client.addListener('message', (from, to, message) => {
    if(message.indexOf("KEY: ") != -1)
    {
        if(!keys.has(from))
        {
            console.log(`[I/O] ${from} joined the channel.`);
            let keyPemString = message.split('KEY: ')[1];
            let newKey = new NodeRSA(b64.atob(keyPemString));
            keys.set(from, newKey);
        }
    }
    else if(message.indexOf('REQKEYS') != -1)
    {
        if(IS_DEBUG)
            console.log(`[KEYS] Received a key request from ${from}. Sending the pubkey!`);
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
    switch(message.command)
    {
        case "err_nosuchnick":
            console.log(`[ERROR] Couldn't send a message to ${message.args[1]}: No such nick`);
            break;
        default:
            console.log('error: ', message);
    }
});
client.addListener("registered", () => {

    client.join(CHANNEL, () => {
        if(IS_DEBUG)
            console.log("[BOOTING] Connected. Sending public key request...");

        client.say(CHANNEL, "REQKEYS");
    
        if(IS_DEBUG)
            console.log("[BOOTING] Sent a key request. Now sending my key...");
    
        sendMyPubKey(client, key);
    
        if(IS_DEBUG)
            console.log("[BOOTING] Public key sent. Ready for interaction...");
        else
            console.log("[BOOTING] Connected!");
        stdin.addListener("data", (rawData) => {
            let data = rawData.toString();
            if(data.indexOf("/list") == 0)
            {
                console.log("[LIST][BEGIN] Using RSAoverIRC");
                keys.forEach((val, k, map) => {
                    console.log(`[LIST] ${k}`);
                });
                console.log("[LIST][END] Using RSAoverIRC");
                return;
            }
            else if(data.indexOf("/broadcast ") == 0 || data.indexOf("/b ") == 0) {
                console.log("[BROADCAST][BEGIN] Broadcasting to all RSAoverIRC users");
                let msg = data.split("/broadcast ")[1];
                if(msg === undefined)
                    msg = data.split("/b ")[1];
                keys.forEach((val, k, map) => {
                    sendMessage(client, k, msg);
                });
                console.log("[BROADCAST][END] Broadcasting to all RSAoverIRC users");
                return;
            }
            else if(data.indexOf("/quit") == 0)
            {
                client.part(CHANNEL, "Bye bye", () => {
                    console.log("[QUIT] See you soon!");
                    process.exit(0);
                });
            }
            let spl = data.split(":");
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

client.addListener("part", (channel, nick, reason, message) => {
    if(keys.has(nick))
    {
        console.log(`[I/O] ${nick} left the channel.`);
        keys.delete(nick);
    }
});