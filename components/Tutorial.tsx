import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type TutorialItem = {
  title: string;
  content: string;
  list?: string[];
};

type TutorialSection = {
  title: string;
  items: Record<string, TutorialItem>;
};

const Tutorial = async () => {
  const t = await getTranslations("Tutorials");

  const sections = t.raw("sections") as Record<string, TutorialSection>;

  return (
    <div className="space-y-10 w-full max-w-4xl">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {Object.entries(sections).map(([sectionKey, section]) => (
        <section key={sectionKey} className="space-y-4">
          <h2 className="text-xl font-medium">{section.title}</h2>

          <Accordion type="multiple" className="w-full">
            {Object.entries(section.items).map(([itemKey, item]) => (
              <AccordionItem
                key={itemKey}
                value={`${sectionKey}-${itemKey}`}
              >
                <AccordionTrigger>{item.title}</AccordionTrigger>

                <AccordionContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {item.content}
                  </p>

                  {Array.isArray(item.list) && item.list.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {item.list.map((li, i) => (
                        <li key={i}>{li}</li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  );
};

export default Tutorial;