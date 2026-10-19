// Chrome 専用 API のうち TypeScript の lib.dom にまだ無いもの

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface ScreenDetailed extends Screen {
  availLeft: number;
  availTop: number;
  isPrimary: boolean;
  label: string;
}

interface ScreenDetails {
  screens: ScreenDetailed[];
  currentScreen: ScreenDetailed;
}

interface Window {
  showSaveFilePicker(options?: {
    suggestedName?: string;
    types?: FilePickerAcceptType[];
  }): Promise<FileSystemFileHandle>;
  showOpenFilePicker(options?: {
    types?: FilePickerAcceptType[];
    multiple?: boolean;
  }): Promise<FileSystemFileHandle[]>;
  getScreenDetails?(): Promise<ScreenDetails>;
}
