"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { SpecCardGrid, type SpecCardItem } from "@/components/spec-card-grid";
import { ModelQuizClient, type ModelQuizItem } from "@/components/model-quiz-client";
import { translate, type Locale } from "@/lib/i18n";

type Props = {
  items: SpecCardItem[];
  models: ModelQuizItem[];
  brandName: string;
  brandKey: string;
  onStart?: () => void;
  hideStart?: boolean;
  locale: Locale;
};

export function ModelQuizGateway({
  items,
  models,
  brandName,
  brandKey,
  onStart,
  hideStart,
  locale,
}: Props) {
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    const triggerStartFromHash = () => {
      if (started) {
        return;
      }
      if (window.location.hash === "#start-quiz") {
        setStarted(true);
        window.history.replaceState(null, "", window.location.pathname);
      }
    };

    triggerStartFromHash();
    window.addEventListener("hashchange", triggerStartFromHash);
    return () => window.removeEventListener("hashchange", triggerStartFromHash);
  }, [started]);

  return (
    <div id="start-quiz" className="flex flex-col gap-8">
      <SpecCardGrid
        items={items}
        emptyLabel={translate(locale, "empty.noModelsToShow")}
        locale={locale}
      />

      {!started && !hideStart ? (
        <div className="flex justify-center">
          <Button
            onClick={() => setStarted(true)}
            className="bg-white text-black hover:bg-white/90"
          >
            {translate(locale, "quiz.start")}
          </Button>
        </div>
      ) : (
        <ModelQuizClient
          brandName={brandName}
          brandKey={brandKey}
          models={models}
          locale={locale}
        />
      )}
    </div>
  );
}
