# RSA over IRC
RSAoverIRC is an IRC client which main feature is using RSA keys to encrypt any communications. This leads to being able to communicate with other RSAoverIRC clients or other software that might be using the same layered-on-top protocol.
You can communicate in clear text too.

## Disclaimer
This is mostly a proof-of-concept and an entertainment project. I'm aware of some flaws this could present and might try to fix those too.

## How to use
For the time being, you just need to start the program. You'll see a list of public keys being registered, which are users you can send messages to. Just type your message in the following format: `destination:Message`
eg: `lacaulac:Hi. This is a test message.`

## Configuration
There isn't much to do here as of yet, but the most plausible way to configure would be command-line arguments or a config file that could be provided by such command line arguments.

## Protocol
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