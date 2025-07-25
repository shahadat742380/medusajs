import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import ZeptoMailNotificationProviderService from "./service";

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [ZeptoMailNotificationProviderService],
});
