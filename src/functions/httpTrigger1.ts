import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import LeprinoPurchaseOrderFactory from "../classes/leprinoPurchaseOrderFactory";
import PurchaseOrderHTML from "../classes/htmlBuilder";

export async function httpTrigger1(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> 
{
	const attachments = request.params["Attachments"];

	context.log(`Http function processed request for url "${request.url}"`);
   
	const factory = new LeprinoPurchaseOrderFactory(atob(atob(attachments)));

	const pdf = new PurchaseOrderHTML(factory);

	const html = pdf.purchaseOrderHTML;

	return { body: html};
};

app.http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: httpTrigger1
});