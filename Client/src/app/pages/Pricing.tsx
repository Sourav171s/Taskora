import { Check, Sparkles, Zap } from "lucide-react";

const freePlanFeatures = [
  "Basic task management",
  "Focus timer",
  "Session tracking",
  "Limited focus insights",
  "Basic analytics",
];

const proPlanFeatures = [
  "Advanced focus insights",
  "Full productivity analytics",
  "Deep work pattern detection",
  "Unlimited session history",
  "Advanced statistics dashboard",
  "Future AI productivity insights",
];

export function Pricing() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-foreground" style={{ fontSize: 22, fontWeight: 600 }}>
          Choose Your Plan
        </h1>
        <p className="text-muted-foreground mt-2" style={{ fontSize: 13 }}>
          Unlock deeper focus insights and advanced productivity analytics
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-2 gap-6 max-w-[720px] mx-auto">
        {/* Free Plan */}
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Free Plan
            </span>
          </div>
          <div className="mb-4">
            <span className="text-foreground" style={{ fontSize: 32, fontWeight: 600 }}>$0</span>
            <span className="text-muted-foreground ml-1" style={{ fontSize: 13 }}>/ month</span>
          </div>
          <p className="text-muted-foreground mb-5" style={{ fontSize: 12.5 }}>
            Everything you need to get started with focused productivity.
          </p>

          <div className="space-y-2.5 flex-1">
            {freePlanFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground" style={{ fontSize: 12.5 }}>{feature}</span>
              </div>
            ))}
          </div>

          <button
            className="mt-6 w-full py-2 rounded-md border border-border text-foreground hover:bg-secondary/60 transition-colors"
            style={{ fontSize: 12.5, fontWeight: 500 }}
          >
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div
          className="bg-card border rounded-lg p-6 flex flex-col relative overflow-hidden"
          style={{ borderColor: "rgba(139, 92, 246, 0.4)", boxShadow: "0 0 24px rgba(139, 92, 246, 0.08), 0 0 48px rgba(139, 92, 246, 0.04)" }}
        >
          {/* Badge */}
          <div
            className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(139, 92, 246, 0.15)", fontSize: 10, fontWeight: 500, color: "#8b5cf6" }}
          >
            <Sparkles className="w-3 h-3" />
            Recommended
          </div>

          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary" style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Pro Plan
            </span>
          </div>
          <div className="mb-4">
            <span className="text-foreground" style={{ fontSize: 32, fontWeight: 600 }}>$9</span>
            <span className="text-muted-foreground ml-1" style={{ fontSize: 13 }}>/ month</span>
          </div>
          <p className="text-muted-foreground mb-5" style={{ fontSize: 12.5 }}>
            Advanced analytics, deep work patterns, and AI-powered insights.
          </p>

          <div className="space-y-2.5 flex-1">
            {proPlanFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-foreground" style={{ fontSize: 12.5 }}>{feature}</span>
              </div>
            ))}
          </div>

          <button
            className="mt-6 w-full py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            style={{ fontSize: 12.5, fontWeight: 500 }}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}
