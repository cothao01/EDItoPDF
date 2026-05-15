import PurchaseOrder from "./purchaseOrder";
import LeprinoPurchaseOrder from "./leprinoPurchaseOrder";
import GlanbiaPurchaseOrder from "./glanbiaPurchaseOrder";
import HormelPurchaseOrder from "./hormelPurchaseOrder";
import JohnDeerePurchaseOrder from "./johnDeerePurchaseOrder";
import LouisianaPacificPurchaseOrder from "./louisianaPacificPurchaseOrder";
import RHPurchaseOrder from "./rhPurchaseOrder";
import RocklinePurchaseOrder from "./rocklinePurchaseOrder";
import KrogerPurchaseOrder from "./krogerPurchaseOrder";
import LandOLakesPurchaseOrder from "./lolPurchaseOrder";
import ThreeMPurchaseOrder from "./threemPurchaseOrder";

type PurchaseOrderConstructor = new (ediString: string) => PurchaseOrder;

const purchaseOrderRegistry: Record<string, PurchaseOrderConstructor> = {
    "LEPRINO": LeprinoPurchaseOrder,
    "GLANBIA": GlanbiaPurchaseOrder,
    "HORMEL": HormelPurchaseOrder,
    "LOUISIANA PACIFIC": LouisianaPacificPurchaseOrder,
    "R&H": RHPurchaseOrder,
    "ROCKLINE": RocklinePurchaseOrder,
    "THREEM": ThreeMPurchaseOrder,
    "KROGER": KrogerPurchaseOrder,
    "LANDOLAKES": LandOLakesPurchaseOrder,
    "JOHN DEERE NA": JohnDeerePurchaseOrder,
};

const DEFAULT_PURCHASE_ORDER = RHPurchaseOrder;

export function createPurchaseOrderFor(companyName: string, ediString: string): PurchaseOrder {
    const PurchaseOrderClass = purchaseOrderRegistry[companyName] ?? DEFAULT_PURCHASE_ORDER;
    return new PurchaseOrderClass(ediString);
}
