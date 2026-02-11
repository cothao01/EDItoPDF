//const { EmailClient } = require("@azure/communication-email");
//
//interface AzureACS 
//{
//  EmailClient: {beginSend},
//  key: string,
//  initialized: boolean
//}
//
//class AzureACS {
//  constructor() {
//    this.EmailClient = null;
//    this.key = null;
//    this.initialized = false; // Track initialization status
//  }
//
//  async init() {
//    if (this.initialized) {
//      console.log("EmailClient is already initialized.");
//      return;
//    }
//
//    try {
//      //const EMAIL_KEY = new AzureKeyCredential(await azureKeyVault.getSecret("ECSSecretKey"));
//      const EMAIL_KEY = "yNou4Tz//P6hXu1KTZ/z8MIq3wG7M+4zXjHWhhD1Nf8CO2j9ql0T9ngIp4w1cYClYJud+/IdnK+5qfMujZt0IQ==";
//      //const EMAIL_ENDPOINT = await azureKeyVault.getSecret("ECSEndpoint");
//      const EMAIL_ENDPOINT = "https://communicationservices-dev.unitedstates.communication.azure.com/";
//      this.EmailClient = new EmailClient(EMAIL_ENDPOINT, EMAIL_KEY);
//      this.key = EMAIL_KEY;
//      this.initialized = true;
//
//      console.log("EmailClient successfully initialized.");
//    } catch (err) {
//      console.error("Failed to initialize EmailClient:", err);
//      this.EmailClient = null;
//      this.initialized = false;
//    }
//  }
//}
//
//const azureACS = new AzureACS();
//
//async function main(resBody) {
//
//    if (!azureACS.initialized) {
//    console.log("Initializing EmailClient...");
//    await azureACS.init();
//  }
//
//  if (!azureACS.EmailClient) {
//    console.error("EmailClient is not initialized. Cannot send email.");
//    return;
//  }
//
//  const emailMessage = {
//    senderAddress: "DoNotReply@hydrite.com",
//    content: {
//      subject: "Test EDI Email from Function",
//      plainText: "",
//      html: `
//      <html>
//        <body>
//          <h1></h1>
//        </body>
//      </html>`,
//    },
//    recipients: {
//      //to: [{ address: resBody.email }],
//      to: [{ address: "collin.thao@hydrite.com" }],
//    },
//    attachments: [
//        {
//            name: "TESTING",
//            contentType: "application/pdf",
//            contentInBase64: resBody.buffer,
//        },
//    ],
//  };
//
//  try {
//    const poller = await azureACS.EmailClient.beginSend(emailMessage);
//    const result = await poller.pollUntilDone();
//    console.log("Email sent successfully:", result);
//  } catch (err) {
//    console.error("Failed to send email:", err);
//  }
//}
//
//async function sendEmail(resBody) {
//  await main(resBody);
//}
//module.exports = { sendEmail };