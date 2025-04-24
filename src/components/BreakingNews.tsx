'use client';

import React, { useState, useEffect } from 'react';
import { fetchBreakingNews, extractNewsData, formatPublishedDate, getSentimentClass } from '../utils/newsUtils';

interface ProcessedNewsArticle {
  id: string;
  title: string;
  description: string;
  snippet: string;
  url: string;
  imageUrl: string;
  publishedAt: Date;
  source: string;
  mainEntity: {
    symbol: string;
    name: string;
    type: string;
    sentimentScore: number;
  } | null;
}

export default function BreakingNews() {
  const [newsArticles, setNewsArticles] = useState<ProcessedNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNews() {
      try {
        setLoading(true);
        const newsResponse = await fetchBreakingNews();
        const processedNews = extractNewsData(newsResponse);
        setNewsArticles(processedNews);
        setError(null);
      } catch (err) {
        console.error('Error loading news:', err);
        setError('Failed to load breaking news');
      } finally {
        setLoading(false);
      }
    }

    loadNews();
    // Refresh news every 5 minutes
    const refreshInterval = setInterval(loadNews, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-4">Breaking News</h2>
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse text-gray-400">Loading news...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-4">Breaking News</h2>
        <div className="text-red-500 text-center p-4">{error}</div>
      </div>
    );
  }

  if (newsArticles.length === 0) {
    return (
      <div className="p-4 border rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-4">Breaking News</h2>
        <div className="text-gray-500 text-center p-4">No breaking news available at this time</div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-4">Breaking News</h2>
      <div className="space-y-4">
        {newsArticles.map((article) => (
          <div key={article.id} className="border-b pb-4">
            <div className="flex gap-4">
              {article.imageUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                </div>
              )}
              <div className="flex-grow">
                <h3 className="font-medium text-lg">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {article.title}
                  </a>
                </h3>
                <p className="text-sm text-gray-600 mt-1">{article.snippet}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>{article.source}</span>
                  <span className="mx-2">•</span>
                  <span>{formatPublishedDate(article.publishedAt.toString())}</span>
                  
                  {article.mainEntity && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="flex items-center">
                        <span className="font-medium">{article.mainEntity.name}</span>
                        <span className="ml-1">({article.mainEntity.symbol})</span>
                        {article.mainEntity.sentimentScore !== null && (
                          <span 
                            className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                              getSentimentClass(article.mainEntity.sentimentScore) === 'positive' 
                                ? 'bg-green-100 text-green-800' 
                                : getSentimentClass(article.mainEntity.sentimentScore) === 'negative'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {getSentimentClass(article.mainEntity.sentimentScore) === 'positive' && '↑'}
                            {getSentimentClass(article.mainEntity.sentimentScore) === 'negative' && '↓'}
                            {getSentimentClass(article.mainEntity.sentimentScore) === 'neutral' && '→'}
                            {` ${(article.mainEntity.sentimentScore * 100).toFixed(1)}%`}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 