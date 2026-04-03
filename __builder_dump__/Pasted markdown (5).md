---

pages/analysis/[id].astro:\
\
import AppLayout from '../../layouts/AppLayout.astro';\
import { Copy, Download, Pin, Trash2 } from 'lucide-react';\
import B12Link from '../../components/B12Link.astro';\
import FilterPanel from '../../components/FilterPanel.astro';

export async function getStaticPaths() {\
return [\
{ params: { id: '1' } },\
{ params: { id: '2' } },\
{ params: { id: '3' } },\
];\
}

const { id } = Astro.params;

// Mock analysis data\
const analysis = {\
id: '1',\
query: 'B2B SaaS project management tools',\
timestamp: new Date('2024-01-15T14:30:00'),\
tags: ['SaaS', 'B2B', 'Project Management'],\
intentMix: [\
{ label: 'Problem Awareness', percentage: 35, color: '#00e8c8' },\
{ label: 'Solution Searching', percentage: 40, color: '#fbbf24' },\
{ label: 'Evaluation', percentage: 20, color: '#a78bfa' },\
{ label: 'Purchase Intent', percentage: 5, color: '#4ade80' },\
],\
confidence: 0.85,\
};

const sections = [\
{\
id: 'executive-summary',\
title: 'Executive Summary',\
content: 'The B2B SaaS project management market is experiencing significant growth with increasing demand for collaborative tools. Teams are increasingly distributed and require seamless integration across multiple platforms.',\
locked: false,\
},\
{\
id: 'demand-clusters',\
title: 'Demand Clusters',\
content: `     <ul class="space-y-2">       <li><span class="text-primary font-mono">Cluster 1:</span> Distributed Team Collaboration (38% market share)</li>       <li><span class="text-primary font-mono">Cluster 2:</span> Enterprise Integration (28%)</li>       <li><span class="text-primary font-mono">Cluster 3:</span> Advanced Analytics (20%)</li>       <li><span class="text-primary font-mono">Cluster 4:</span> Mobile-First Solutions (14%)</li>     </ul>
    `,\
locked: false,\
},\
{\
id: 'intent-breakdown',\
title: 'Intent Breakdown',\
content: `     <ul class="space-y-2">       <li><span class="text-primary font-mono">Problem Awareness:</span> 35% - Teams recognizing need for better collaboration</li>       <li><span class="text-primary font-mono">Solution Searching:</span> 40% - Active evaluation of project management solutions</li>       <li><span class="text-primary font-mono">Evaluation:</span> 20% - Comparing features and pricing</li>       <li><span class="text-primary font-mono">Purchase Intent:</span> 5% - Ready to buy</li>     </ul>
    `,\
locked: false,\
},\
{\
id: 'customer-segments',\
title: 'Customer Segments',\
content: `     <ul class="space-y-2">       <li><span class="text-primary font-mono">Segment A:</span> Growing Tech Startups (25-50 employees, $2-10M ARR)</li>       <li><span class="text-primary font-mono">Segment B:</span> Mid-Market SaaS (50-250 employees, $10-100M ARR)</li>       <li><span class="text-primary font-mono">Segment C:</span> Enterprise Tech Teams (250+ employees, $100M+ ARR)</li>       <li><span class="text-primary font-mono">Segment D:</span> Creative Agencies (10-50 employees, client work)</li>     </ul>
    `,\
locked: false,\
},\
{\
id: 'pain-points',\
title: 'Pain Points',\
content: `     <ul class="space-y-2">       <li><span class="text-destructive font-mono">1. Context Switching:</span> Teams jumping between 5-7 different tools daily</li>       <li><span class="text-destructive font-mono">2. Lack of Visibility:</span> Project status unclear across teams</li>       <li><span class="text-destructive font-mono">3. Integration Gaps:</span> Tools don't talk to each other</li>       <li><span class="text-destructive font-mono">4. Onboarding Time:</span> 2-4 weeks to get team productive</li>       <li><span class="text-destructive font-mono">5. Cost Sprawl:</span> Too many tools, budget overruns</li>     </ul>
    `,\
locked: false,\
},\
{\
id: 'objections',\
title: 'Objections',\
content: `     <ul class="space-y-2">       <li><span class="text-yellow-400 font-mono">Price Sensitivity:</span> "Our existing tools are already paid for"</li>       <li><span class="text-yellow-400 font-mono">Legacy Constraints:</span> "We can't switch from Jira/Asana, too integrated"</li>       <li><span class="text-yellow-400 font-mono">Learning Curve:</span> "Our team won't spend time learning new software"</li>       <li><span class="text-yellow-400 font-mono">Data Migration:</span> "Moving project history would take months"</li>     </ul>
    `,\
locked: false,\
},\
{\
id: 'acquisition-angles',\
title: 'Acquisition Angles',\
content: `     <ul class="space-y-2">       <li><span class="text-green-400 font-mono">Integration Play:</span> Position as the hub for existing tools</li>       <li><span class="text-green-400 font-mono">AI Angle:</span> Smart project insights powered by AI</li>       <li><span class="text-green-400 font-mono">Free Forever:</span> Start free for small teams</li>       <li><span class="text-green-400 font-mono">ROI Calculator:</span> "Save X hours per week on context switching"</li>     </ul>
    `,\
locked: true,\
},\
{\
id: 'messaging-direction',\
title: 'Messaging Direction',\
content: `     <ul class="space-y-2">       <li><span class="text-primary font-mono">Headline:</span> "One workspace. All your projects. No context switching."</li>       <li><span class="text-primary font-mono">Tagline:</span> "The command center for distributed teams"</li>       <li><span class="text-primary font-mono">Benefit Focus:</span> Speed, clarity, reduced meetings</li>     </ul>
    `,\
locked: true,\
},\
{\
id: 'market-gaps',\
title: 'Market Gaps',\
content: `     <ul class="space-y-2">       <li><span class="text-blue-400 font-mono">No True Universal Solution:</span> Every tool forces workflow compromises</li>       <li><span class="text-blue-400 font-mono">AI Readiness:</span> Most tools slow to add AI capabilities</li>       <li><span class="text-blue-400 font-mono">Mobile Experience:</span> Project management on mobile is weak</li>       <li><span class="text-blue-400 font-mono">Transparent Pricing:</span> Hidden per-user costs are common</li>     </ul>
    `,\
locked: true,\
},\
{\
id: 'strategic-recommendations',\
title: 'Strategic Recommendations',\
content: `     <ul class="space-y-2">       <li><span class="text-primary font-mono">1. Start with Integration:</span> Build the best API/integrations first, not features</li>       <li><span class="text-primary font-mono">2. Target the 30-50 employee sweet spot:</span> Big enough to have problems, small enough to switch</li>       <li><span class="text-primary font-mono">3. Partner with adjacent tools:</span> Slack, GitHub, Linear integrations</li>       <li><span class="text-primary font-mono">4. Lead with AI:</span> Smart insights not yet available in competitors</li>       <li><span class="text-primary font-mono">5. Build a migration playbook:</span> Make switching from Jira/Asana painless</li>     </ul>
    `,\
locked: true,\
},\
];

const formattedTime = analysis.timestamp.toLocaleDateString('en-US', {\
month: 'short',\
day: 'numeric',\
year: 'numeric',\
hour: '2-digit',\
minute: '2-digit',\
});

## const confidencePercentage = Math.round(analysis.confidence \* 100);

\<AppLayout title={`Analysis: ${analysis.query}`}>

```
  <!-- Tags -->
  <div class="flex flex-wrap gap-2 mb-4">
    {analysis.tags.map((tag) => (
      <span class="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
        {tag}
      </span>
    ))}
  </div>

  <!-- Intent Mix and Confidence -->
  <div class="grid grid-cols-2 gap-4">
    <div>
      <p class="text-xs text-muted-foreground font-mono mb-2">Intent Mix</p>
      <div class="flex h-2 rounded-full overflow-hidden gap-0.5 bg-muted/30">
        {analysis.intentMix.map((item) => (
          <div
            class="rounded-full"
            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
            title={`${item.label}: ${item.percentage}%`}
          />
        ))}
      </div>
      <div class="text-xs text-muted-foreground mt-2 space-y-1">
        {analysis.intentMix.map((item) => (
          <div>{item.label}: <span style={{ color: item.color }} class="font-bold">{item.percentage}%</span></div>
        ))}
      </div>
    </div>
    <div>
      <p class="text-xs text-muted-foreground font-mono mb-2">Confidence Score</p>
      <div class="text-3xl font-bold text-primary mb-2">{confidencePercentage}%</div>
      <p class="text-xs text-muted-foreground">High confidence in market signal</p>
    </div>
  </div>
</div>

<!-- Analysis Sections -->
<div class="space-y-6">
  {sections.map((section) => (
    <section id={section.id} class="border-glow rounded-lg bg-card/50 p-6 scroll-mt-24">
      <h2 class="text-xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
        {section.title}
        {section.locked && (
          <span class="ml-auto text-xs bg-secondary/20 border border-secondary/30 text-secondary px-2 py-1 rounded font-mono font-medium">Pro</span>
        )}
      </h2>

      {section.locked ? (
        <div class="relative">
          <div class="blur-sm opacity-50 pointer-events-none" set:html={section.content} />
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <p class="text-sm font-heading text-foreground mb-2">This section is locked</p>
              <p class="text-xs text-muted-foreground mb-3">Upgrade to unlock deeper insights</p>
              <button class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
                Unlock with Pro
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div class="text-sm text-foreground space-y-2 leading-relaxed" set:html={section.content} />
      )}
    </section>
  ))}
</div>

<div class="mt-12 border-t border-border pt-8">
  <B12Link />
</div>
```

```
  <div class="pt-4 border-t border-border">
    <a href="/" class="text-primary hover:text-primary/80 text-xs transition-colors">← Back to Workspace</a>
  </div>
</div>
```
