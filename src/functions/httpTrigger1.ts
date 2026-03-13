import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import LeprinoPurchaseOrderFactory from "../classes/leprinoPurchaseOrderFactory";
import GlanbiaPurchaseOrderFactory from "../classes/glanbiaPurchaseOrderFactory";
import HormelPurchaseOrderFactory from "../classes/hormelPurchaseOrderFactory";
import JohnDeerePurchaseOrderFactory from "../classes/johnDeerePurchaseOrderFactory";
import LouisianaPacificPurchaseOrderFactory from "../classes/louisianaPacificPurchaseOrderFactory";
import RHPurchaseOrderFactory from "../classes/rhPurchaseOrderFactory";
import RocklinePurchaseOrderFactory from "../classes/rocklinePurchaseOrderFactory";
import KrogerPurchaseOrderFactory from "../classes/krogerPurchaseOrderFactory";
import LandOLakesPurchaseOrderFactory from "../classes/lolPurchaseOrderFactory";
import ThreeMPurchaseOrderFactory from "../classes/threemPurchaseOrderFactory";
import PurchaseOrderHTML from "../classes/htmlBuilder";
import helpers from "../helpers/helpers";
import PurchaseOrderFactory from "../classes/purchaseOrderFactory";

const {getCustomerNumberFrom, transformSubjectNameFrom, splitEdiByPurchaseOrder, getCompanyNameFrom} = helpers;

function determineCompanyFactory(companyName, ediString)
{
    const factories = 
    {
        "LEPRINO": LeprinoPurchaseOrderFactory,
        "GLANBIA": GlanbiaPurchaseOrderFactory,
        "HORMEL": HormelPurchaseOrderFactory,
		"LOUISIANA PACIFIC": LouisianaPacificPurchaseOrderFactory,
		"R&H": RHPurchaseOrderFactory,
		"ROCKLINE": RocklinePurchaseOrderFactory,
		"THREEM": ThreeMPurchaseOrderFactory,
		"KROGER":KrogerPurchaseOrderFactory,
		"LANDOLAKES":LandOLakesPurchaseOrderFactory,
		"JOHN DEERE NA":JohnDeerePurchaseOrderFactory
    }

	if (factories[companyName])
	{
		return new factories[companyName](ediString);
	}
	else
	{
		// RH seems to fit most cases; I'll switch the parent logic to represent this eventually
		return new RHPurchaseOrderFactory(ediString);
	}
}

export async function httpTrigger1(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> 
{
	const attachments = request.params["Attachments"];
	const subjectName = request.params["SubjectName"];
	const companyName = getCompanyNameFrom(subjectName);

	context.log(`Http function processed request for url "${request.url}"`);
	context.log(`Logging attachments: "${atob(atob(attachments))}"`);
	
	const purchaseOrders = splitEdiByPurchaseOrder(atob(atob(attachments)));

	let purchaseOrderHTML = [];
	let subjectNames = [];

	context.log("Processing orders...\n");

	for (let i = 0; i < purchaseOrders.length; ++i)
	{
		context.log("Purchase Orders: ", purchaseOrders);
		const factory = determineCompanyFactory(companyName, purchaseOrders[i]);

		const pdf = new PurchaseOrderHTML(factory);

		const customerNumber = getCustomerNumberFrom(subjectName, companyName, pdf.purchaseOrder.orderType);

		const fixedSubjectName = transformSubjectNameFrom(subjectName, pdf.purchaseOrder.orderType, pdf.purchaseOrder.poNumber, customerNumber);

		purchaseOrderHTML.push(pdf.purchaseOrderHTML);
		subjectNames.push(fixedSubjectName);
	}
	context.log("HTML: " + JSON.stringify(purchaseOrderHTML));


	return { body: JSON.stringify({"POS": purchaseOrderHTML, "SubjectNames": subjectNames})};
};

app.http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: httpTrigger1
});