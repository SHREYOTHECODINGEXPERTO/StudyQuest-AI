'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, Cell, Legend } from 'recharts';
import { BarChart3, AlertCircle, Sparkles, BrainCircuit, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const { token } = useStore();

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Auto redirect if token missing
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      api.get('/analytics')
        .then((res) => {
          setAnalyticsData(res);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cozy-lavender border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 mt-2">Compiling behavior charts...</p>
      </div>
    );
  }

  const chartData = analyticsData?.chartData || [];
  const latestReport = analyticsData?.latestReport;

  // Behavior metrics
  const behaviorIndices = [
    { name: 'Avoidance Index', score: latestReport?.avoidanceScore ?? 25, color: '#FFADAD', desc: 'Delaying practice tests' },
    { name: 'Knowledge Gap Index', score: latestReport?.knowledgeGapScore ?? 35, color: '#C1A3FF', desc: 'Scoring low on quiz tests' },
    { name: 'Passive Learning Index', score: latestReport?.passiveLearningScore ?? 45, color: '#FFDAC1', desc: 'Excessive re-reading/watching' },
    { name: 'Motivation Drop Index', score: latestReport?.motivationDropScore ?? 20, color: '#9BF6FF', desc: 'Brief bursts & high distractions' },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-black text-gray-800 dark:text-[#F3EFE6]">Habits Diagnostics & Analytics 📊</h2>
        <p className="text-xs text-gray-500 mt-1">
          Detailed metrics compiled by the AI Behavior Engine to find WHY you get stuck.
        </p>
      </div>

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase">Total Study Time</span>
          <p className="text-2xl font-bold text-cozy-lavender-deep mt-1">{analyticsData?.totalStudyMinutes || 0}m</p>
        </div>
        <div className="glass-card p-4 text-center">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase">Average Focus</span>
          <p className="text-2xl font-bold text-cozy-mint-deep mt-1">{analyticsData?.averageFocusScore || 100}%</p>
        </div>
        <div className="glass-card p-4 text-center">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase">Distraction Count</span>
          <p className="text-2xl font-bold text-cozy-peach-deep mt-1">{analyticsData?.distractionCount || 0}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase">Active Recall Ratio</span>
          <p className="text-2xl font-bold text-blue-500 mt-1">{analyticsData?.activeRecallRatio || 0}%</p>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COMPOSITE TIMELINE CHART */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-sm text-gray-800 dark:text-[#F3EFE6]">Weekly Study Trend</h3>
            <span className="text-[10px] bg-cozy-sky/40 text-blue-700 px-2 py-0.5 rounded font-semibold">Active vs Focus</span>
          </div>

          <div className="w-full h-[250px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <XAxis dataKey="day" stroke="#A0A0A0" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#A0A0A0" fontSize={11} tickLine={false} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#A0A0A0" fontSize={11} tickLine={false} label={{ value: 'Focus %', angle: 90, position: 'insideRight', style: { fontSize: 10 } }} />
                  <Tooltip contentStyle={{ background: '#FAF6EE', border: '1px solid #CCD5AE', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar yAxisId="left" dataKey="studyMinutes" name="Study Time (min)" fill="#C1A3FF" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="averageFocus" name="Focus Score (%)" stroke="#FFADAD" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                No session logs recorded this week yet.
              </div>
            )}
          </div>
        </div>

        {/* TOPIC DISTRIBUTION */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <h3 className="font-bold text-sm text-gray-800 dark:text-[#F3EFE6] mb-4">Study Distribution</h3>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[220px] pr-2">
            {analyticsData?.categoryDistribution && analyticsData.categoryDistribution.length > 0 ? (
              analyticsData.categoryDistribution.map((item: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                    <span>{item.topic} ({item.category})</span>
                    <span>{item.studyMinutes}m</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cozy-sky-deep h-full rounded-full"
                      style={{ width: `${Math.min(100, (item.studyMinutes / (analyticsData.totalStudyMinutes || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-12">No topic coordinates log recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* AI BEHAVIOR DIAGNOSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PROGRESS METRICS */}
        <div className="glass-card p-6 lg:col-span-1 space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <Activity className="text-cozy-lavender-deep" size={18} />
            <h3 className="font-bold text-sm text-gray-800 dark:text-[#F3EFE6]">AI Habit Scores</h3>
          </div>

          <div className="space-y-4">
            {behaviorIndices.map((b, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                  <span>{b.name}</span>
                  <span style={{ color: b.color }}>{b.score}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${b.score}%`, backgroundColor: b.color }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 italic">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* INTERVENTIONS & ADVICE BUBBLE */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              <BrainCircuit className="text-cozy-mint-deep" size={18} />
              <h3 className="font-bold text-sm text-gray-800 dark:text-[#F3EFE6]">Latest AI Coaching Diagnosis</h3>
            </div>

            {latestReport ? (
              <div className="space-y-4">
                <div className="p-4 bg-cozy-cream-light dark:bg-black/20 border border-cozy-cream-dark rounded-2xl relative">
                  <span className="text-[10px] bg-cozy-lavender text-cozy-lavender-deep font-extrabold px-2 py-0.5 rounded absolute -top-2 left-6">
                    Summary Analysis
                  </span>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mt-1">
                    {latestReport.reportSummary}
                  </p>
                </div>

                <div className="p-4 bg-cozy-mint/10 border border-cozy-mint rounded-2xl relative">
                  <span className="text-[10px] bg-cozy-mint text-cozy-mint-deep font-extrabold px-2 py-0.5 rounded absolute -top-2 left-6">
                    Recommended Study Adjustment
                  </span>
                  <div
                    className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mt-1"
                    dangerouslySetInnerHTML={{ __html: latestReport.coachingAdvice }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400 italic bg-gray-50 dark:bg-black/10 rounded-2xl border border-gray-100 dark:border-gray-800">
                🌱 No study logs analyzed yet! Complete a session with the focus timer to get your AI behavior coaching report card.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
