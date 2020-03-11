# RSAoverIRC
RSAoverIRC is an IRC client which main feature is using RSA keys to encrypt any communications. This leads to being able to communicate with other RSAoverIRC clients or other RSAonIRC compliant software.
You can use this client to communicate in clear text, even though I don't get why you would do that!

## Disclaimer
This is mostly a proof-of-concept and an entertainment project. I'm aware of some flaws this could present and might try to fix those too. Also it's hella cumbersome to use.

## How to use

### Launch parameters
```
Options:
    -c, --channel [value]   The broadcast channel (defaults to "#rsaoverirc")
    -d, --debug             Should we print unnecessary information? (disabled by default)
    -H, --help              Output usage information
    -h, --host [value]      The IRC server address (defaults to "irc.epiknet.org")
    -k, --keypair [value]   The keypair path (defaults to ".\\keypair.pem")
    -n, --nickname [value]  Desired nickname (defaults to "rsaoverirc")
    -p, --port              The IRC server port (currently unused)
    -v, --version           Output the version number
```

### Once connected
For the time being, you just need to start the program. You'll see a list of public keys being registered, which are users you can send messages to. Just type your message in the following format: `destination:Message`
eg: `lacaulac:Hi. This is a test message.`

There's also 3 commands available:
- `/list`: Lists connected users running a RSAonIRC compliant client
    - **Known bug:** Users not using the command `/quit` might not disappear from the list
- `/broadcast <msg>`: Sends a message to every RSAonIRC user connected on the same broadcast channel
    - The `/b <msg>` alias also works
- `/quit`: Disconnects from the channel and exits the client

## Configuration
You can kinda "configure" the program through command line arguments, but a configuration file system should be coming soon!

## Protocol

*If you're only using RSAoverIRC, this might be a bit boring*

### Requesting keys

To request the public keys of everyone in the current channel, the command is `REQKEYS`. This will make every client issue a `KEY` command.

### Receiving keys

When joining the channel or being asked, a client will send his public key in the following form:

`KEY: <Base64EncodedPemFormattedPublicKey>`

eg: `KEY: LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZ3d0RRWUpLb1pJaHZjTkFRRUJCUUFEU3dBd1NBSkJBS0ZNM3B0alVTOVY5U3gxeHUzbk8rSEV3K0t5MVAzSwpoOVpVdlpwc2FJQkdVenJ5RkRqSUkvR0M3RWY4RWJpY21wVFdhUmxEeXZYRHNNNWtveWNtNXNNQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQ==`

### Sending a message

To send a message from one client to another, send a private message in such a way:
`MSG: <base64encodedEncryptedMessage>`

eg: `MSG: Odko+yzJVRlMOOKEWFvZV5pshZhnqhRgEGsqnlLagRx5Of0/IzQyeV1oISpoCZTZc+0SAS1wYg5YMT7I18jq1g7Dlna29Oe73ZzO6riJutNAGM/bG0eDtgWWZucJO2Pqw5UKOrK1tvvvhoK4AQYpQ+QJOHHJunnDqrbAeZcxgm8=`