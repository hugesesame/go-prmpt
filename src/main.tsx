import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LangProvider } from './i18n';
import { OutputWindow } from './output/OutputWindow';
import { PrimaryApp } from './primary/PrimaryApp';
import './styles.css';

// 同じページを ?output 付きで開くとセカンダリー画面になる
const isOutput = new URLSearchParams(location.search).has('output');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>{isOutput ? <OutputWindow /> : <PrimaryApp />}</LangProvider>
  </StrictMode>,
);
