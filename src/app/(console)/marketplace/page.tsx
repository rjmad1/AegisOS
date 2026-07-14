// src/app/(console)/marketplace/page.tsx

"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Alert } from '@/components/ui/Alert';
import { ShoppingBag, Star, ShieldCheck, Download, AlertCircle, RefreshCw, X, ArrowLeft } from 'lucide-react';

export default function MarketplacePage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [installing, setInstalling] = React.useState(false);
  const [installSuccess, setInstallSuccess] = React.useState<string | null>(null);
  const [installError, setInstallError] = React.useState<string | null>(null);

  // Review submission state
  const [userRating, setUserRating] = React.useState<number>(5);
  const [userComment, setUserComment] = React.useState<string>('');
  const [submittingReview, setSubmittingReview] = React.useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const url = selectedType !== 'all' ? `/api/v1/developer/marketplace?type=${selectedType}` : '/api/v1/developer/marketplace';
      const res = await fetch(url);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to load marketplace items", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchItems();
  }, [selectedType]);

  const handleOpenDetail = (item: any) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
    setInstallSuccess(null);
    setInstallError(null);
    setUserRating(5);
    setUserComment('');
  };

  const handleInstall = async () => {
    if (!selectedItem) return;
    setInstalling(true);
    setInstallSuccess(null);
    setInstallError(null);

    try {
      const res = await fetch('/api/v1/developer/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'install',
          id: selectedItem.id,
          tenantId: 'tenant-default'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setInstallSuccess(`Successfully installed package ${selectedItem.name}!`);
        // Refresh items list
        fetchItems();
      } else {
        setInstallError(data.error || "Failed to install item.");
      }
    } catch (err: any) {
      setInstallError(err.message || "Network error occurred.");
    } finally {
      setInstalling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedItem) return;
    setSubmittingReview(true);

    try {
      const res = await fetch('/api/v1/developer/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          id: selectedItem.id,
          rating: userRating,
          comment: userComment,
          userEmail: 'developer@example.com'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedItem(data.item);
        setUserComment('');
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl"></div>
        
        <div className="space-y-2">
          <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-800/40 text-xs px-2.5 py-0.5">
            Registry Storefront
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Extension Marketplace
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm">
            Discover community and verified modules including agents, custom prompts, tools, template packs, and plugins.
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2.5 border-b border-slate-800 pb-4">
        {[
          { id: 'all', label: 'All Categories' },
          { id: 'agent', label: 'Agents' },
          { id: 'plugin', label: 'Plugins' },
          { id: 'workflow', label: 'Workflows' },
          { id: 'prompt', label: 'Prompts' },
          { id: 'tool', label: 'Tools' }
        ].map((cat) => (
          <Button
            key={cat.id}
            onClick={() => setSelectedType(cat.id)}
            variant={selectedType === cat.id ? 'primary' : 'outline'}
            className={`text-xs px-4 py-2 rounded-lg border-slate-800 ${
              selectedType === cat.id 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-slate-100' 
                : 'text-slate-300 hover:bg-slate-900/40 hover:text-slate-100'
            }`}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Grid of items */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
          <span className="text-slate-400 text-sm">Loading package registry...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center h-64 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
          No marketplace items found matching this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card 
              key={item.id} 
              onClick={() => handleOpenDetail(item)}
              className="bg-slate-900/40 border-slate-800 backdrop-blur-md hover:border-slate-700 cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge className="bg-slate-950 text-slate-400 border border-slate-800 text-xs uppercase px-2 py-0.5">{item.type}</Badge>
                  {item.isVerified && (
                    <Badge className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 flex items-center gap-1 text-xs px-2 py-0.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg font-bold text-slate-200">{item.name}</CardTitle>
                <CardDescription className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Version {item.version}</span>
                  <span>•</span>
                  <span>By {item.author}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">{item.ratingsAverage}</span>
                    <span className="text-[10px] text-slate-500">({item.ratingsCount})</span>
                  </div>
                  <div className="text-xs font-semibold text-cyan-400 uppercase">
                    {item.pricingType === 'free' ? 'Free' : item.pricingType === 'subscription' ? `$${item.price}/mo` : `$${item.price}/run`}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Package Detail Modal */}
      {selectedItem && (
        <Dialog 
          isOpen={isDetailOpen} 
          onClose={() => setIsDetailOpen(false)}
          title={selectedItem.name}
          description={`ID: ${selectedItem.id} | Author: ${selectedItem.author} | License: ${selectedItem.license}`}
          size="lg"
        >
          <div className="flex items-center gap-2 mb-4 -mt-2">
            <Badge className="bg-slate-950 text-slate-400 border border-slate-800 text-xs px-2">{selectedItem.type}</Badge>
            {selectedItem.isVerified && (
              <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800/50 flex items-center gap-1 text-xs px-2">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Developer
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Left detail panel */}
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-300">Description</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedItem.description}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-300">Technical Details</h3>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2.5 font-mono text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Declared Version</span>
                      <span>{selectedItem.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">AegisOS Requirement</span>
                      <span>{selectedItem.dependencies.aegisos || ">=1.0.0"}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-800">
                      <span className="text-slate-500">Digital Signature (Sigstore/Cosign SHA256)</span>
                      <span className="text-[10px] text-cyan-400/80 break-all select-all">{selectedItem.signature}</span>
                    </div>
                  </div>
                </div>

                {/* Reviews section */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold text-slate-300">Developer Reviews & Ratings</h3>
                  
                  <div className="space-y-3">
                    {selectedItem.reviews.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No reviews submitted yet. Be the first to leave a comment.</p>
                    ) : (
                      selectedItem.reviews.map((rev: any) => (
                        <div key={rev.id} className="border border-slate-850 bg-slate-950/20 p-3 rounded-lg space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-300">{rev.userEmail}</span>
                            <span className="text-slate-500">{new Date(rev.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <p className="text-xs text-slate-400">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Submit review interface */}
                  <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-300">Submit a Review</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Rating:</span>
                      <select 
                        value={userRating}
                        onChange={(e) => setUserRating(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-800 text-xs rounded p-1 text-slate-300"
                      >
                        <option value={5}>5 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={2}>2 Stars</option>
                        <option value={1}>1 Star</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Write your verification/experience feedback here..."
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none"
                    />
                    <Button 
                      onClick={handleSubmitReview}
                      disabled={submittingReview || !userComment}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 h-auto rounded"
                    >
                      Submit Review
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right install settings panel */}
              <div className="space-y-6">
                <Card className="bg-slate-950 border-slate-850 p-4 rounded-xl">
                  <CardHeader className="p-0 pb-3 mb-3 border-b border-slate-800">
                    <CardTitle className="text-sm font-bold">Package Entitlements</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Pricing Model</span>
                      <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-800/40 font-bold uppercase">
                        {selectedItem.pricingType}
                      </Badge>
                    </div>
                    {selectedItem.price && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Price Rate</span>
                        <span className="font-extrabold text-cyan-400 text-sm">
                          ${selectedItem.price.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Download Volume</span>
                      <span className="text-slate-300">{selectedItem.downloadCount} installs</span>
                    </div>

                    {installSuccess && (
                      <Alert variant="success" title="Success">
                        {installSuccess}
                      </Alert>
                    )}

                    {installError && (
                      <Alert variant="destructive" title="Error">
                        {installError}
                      </Alert>
                    )}

                    <Button 
                      onClick={handleInstall} 
                      disabled={installing}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-slate-100 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
                    >
                      {installing ? 'Verifying Billing...' : 'Install Extension'}
                      <Download className="h-4 w-4 text-slate-100" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
        </Dialog>
      )}
    </div>
  );
}
