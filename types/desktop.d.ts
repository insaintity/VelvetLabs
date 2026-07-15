export {};

declare global {
  interface Window {
    velvetDesktop?: {
      windowAction: (action: "minimize" | "maximize" | "close") => void;
    };
  }
}
