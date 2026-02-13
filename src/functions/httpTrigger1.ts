import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import generateDocumentFromEDI from "../helpers/parseEDI"

export async function httpTrigger1(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> 
{
    	
	const attachments = request.params["Attachments"];

	context.log(`Http function processed request for url "${request.url}"`);
   
	context.log("Request: ", request);

	const parsedEDIText = generateDocumentFromEDI(atob(atob(attachments)));

	context.log("EDI TEXT TESTING: ", parsedEDIText);

    	const name = request.query.get('name') || await request.text() || 'world';

    	return { body: parsedEDIText };
};

app.http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: httpTrigger1
});