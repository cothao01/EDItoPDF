import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import LeprinoPurchaseOrderFactory from "../classes/leprinoPurchaseOrderFactory";
import GlanbiaPurchaseOrderFactory from "../classes/glanbiaPurchaseOrderFactory";
import HormelPurchaseOrderFactory from "../classes/hormelPurchaseOrderFactory";
import JohnDeerePurchaseOrderFactory from "../classes/johnDeerePurchaseOrderFactory";
import LouisianaPacificPurchaseOrderFactory from "../classes/louisianaPacificPurchaseOrderFactory";
import RHPurchaseOrderFactory from "../classes/rhPurchaseOrderFactory";
import PurchaseOrderHTML from "../classes/htmlBuilder";
import helpers from "../helpers/helpers";
import PurchaseOrderFactory from "../classes/purchaseOrderFactory";

const {getCompanyNameFrom} = helpers;

function determineCompanyFactory(companyName, ediString)
{
    const factories = 
    {
        "LEPRINO": LeprinoPurchaseOrderFactory,
        "GLANBIA": GlanbiaPurchaseOrderFactory,
        "HORMEL": HormelPurchaseOrderFactory,
		"LOUISIANA PACIFIC": LouisianaPacificPurchaseOrderFactory,
		"R&H": RHPurchaseOrderFactory,
		"JOHN DEERE NA":JohnDeerePurchaseOrderFactory
    }

	if (factories[companyName])
	{
		return new factories[companyName](ediString);
	}
	else
	{
		return new PurchaseOrderFactory(ediString);
	}
}

export async function httpTrigger1(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> 
{
	const attachments = request.params["Attachments"];
	const subjectName = request.params["SubjectName"];
	const companyName = getCompanyNameFrom(subjectName);

	console.log("COMPANYNAME: " + companyName, "LENGTH: " + companyName.length);

	context.log(`Http function processed request for url "${request.url}"`);
   
	const factory = determineCompanyFactory(companyName, atob(atob(attachments)));

	const pdf = new PurchaseOrderHTML(factory);

	const html = pdf.purchaseOrderHTML;

	return { body: html};
};

app.http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: httpTrigger1
});