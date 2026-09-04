import React from 'react';
import { MousePointerClick, HelpCircle, Send, Trophy, ArrowRight } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Choose a Quiz',
      description: 'Browse the published event quizzes and select a challenge that matches your interest.',
      icon: MousePointerClick
    },
    {
      number: '02',
      title: 'Answer Questions',
      description: 'Step through questions at your pace, select your answers, and review responses before submitting.',
      icon: HelpCircle
    },
    {
      number: '03',
      title: 'Submit Your Quiz',
      description: 'Your answers are sent securely to our server-side scoring engine for instant verification.',
      icon: Send
    },
    {
      number: '04',
      title: 'See Your Result',
      description: 'Receive your score, percentage breakdown, and completion confirmation immediately.',
      icon: Trophy
    }
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-[#FAF8F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#A50D52] bg-[#F3D6E1]/50 px-3.5 py-1 rounded-full border border-[#D83B70]/20">
            Simple 4-Step Flow
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#24141C]">
            How QuizMania Works
          </h2>
          <p className="text-sm text-[#6B5A62]">
            Fast, accessible, and enjoyable for participants on any device.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-white rounded-2xl border border-[#F0E1E8] p-6 space-y-4 shadow-qm-card hover:shadow-qm-glow transition-all relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black tracking-wider text-[#A50D52] bg-[#F3D6E1]/60 px-2.5 py-1 rounded-lg">
                      Step {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F9] border border-[#F0E1E8] flex items-center justify-center text-[#A50D52]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#24141C] mb-2">
                    {step.title}
                  </h3>

                  <p className="text-xs text-[#6B5A62] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-white border border-[#F0E1E8] shadow-xs flex items-center justify-center text-[#A50D52]">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
