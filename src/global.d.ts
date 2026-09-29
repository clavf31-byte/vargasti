declare const __APP_VERSION__: string;
declare const __GIT_HASH__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_NUMBER__: string;

declare module "qrcode.react" {
  import type { ComponentType } from "react";

  const QRCode: ComponentType<{
    value: string;
    size?: number;
    level?: "L" | "M" | "Q" | "H";
    includeMargin?: boolean;
  }>;
  export default QRCode;
}
