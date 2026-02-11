import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import generateDocumentFromEDI from "../helpers/parseEDI"

export async function httpTrigger1(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> 
{
    	
	const attachments = request.params["Attachments"];

	context.log(`Http function processed request for url "${request.url}"`);
   
	context.log("Request: ", request);

	const parsedEDIText = generateDocumentFromEDI(attachments);

	console.log("TESTING123");

	context.log("EDI: ", parsedEDIText);

    	const name = request.query.get('name') || await request.text() || 'world';

    	return { body: `Hello, ${name}!` };
};

app.http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: httpTrigger1
});
