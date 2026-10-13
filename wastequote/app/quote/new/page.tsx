import { company } from "@/lib/data";
import { listDemoPhotos } from "@/lib/demo";
import { sailsrepStatus } from "@/lib/sailsrep";
import { visionLabel, visionProvider } from "@/lib/vision/provider";
import { QuoteWizard } from "@/components/wizard/QuoteWizard";

export const dynamic = "force-dynamic";

export default function NewQuotePage() {
  const s = sailsrepStatus();
  return (
    <QuoteWizard
      info={{
        demoPhotos: listDemoPhotos(),
        vision: { provider: visionProvider(), label: visionLabel(visionProvider()) },
        sailsrep: { configured: s.configured, tenant: s.tenant, reason: s.reason },
        customer: {
          company: company.demo_customer.company,
          site: company.demo_customer.site,
          contact: company.demo_customer.contact,
          email: "",
          nace: company.demo_customer.sic_or_nace,
        },
      }}
    />
  );
}
