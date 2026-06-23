import { useEffect, useState } from 'react';
import { templates } from './data/catalog';
import type { ResumeTemplate } from './types';
import { Editor } from './components/Editor';
import { Gallery } from './components/Gallery';

function routeTemplateId(): string | null {
  const match = window.location.hash.match(/^#\/editor\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function App() {
  const [templateId, setTemplateId] = useState(routeTemplateId());

  useEffect(() => {
    const handler = () => setTemplateId(routeTemplateId());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const template = templateId ? templates.find((item) => item.id === templateId) : undefined;
  const open = (target: ResumeTemplate) => { window.location.hash = `/editor/${encodeURIComponent(target.id)}`; };
  const back = () => { window.location.hash = '/gallery'; };

  if (template) return <Editor template={template} onBack={back} />;
  return <Gallery onOpen={open} />;
}
