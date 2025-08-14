import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import { useAuth } from '@/hooks/use-auth';
import {
  getAnalysisReports,
  updateAnalysisReportStatus,
  getResume,
  getJobDescription,
  getAnalysisSummaryByReportId,
  getAnalysisScoresByReportId,
  getAnalysisRecommendationsByReportId,
  AnalysisReportOut,
  AnalysisReportStatus,
  ResumeOut,
  JobDescriptionOut,
  AnalysisSummaryOut,
  AnalysisScoreOut,
  AnalysisRecommendationOut,
} from '@/utils/gibsonAiApi';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';

const statusOptions: AnalysisReportStatus[] = ['not_applied', 'applied', 'interviewing', 'offer', 'rejected'];

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [analysisReports, setAnalysisReports] = useState<AnalysisReportOut[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedReport, setSelectedReport] = useState<AnalysisReportOut | null>(null);
  const [detailedResume, setDetailedResume] = useState<ResumeOut | null>(null);
  const [detailedJobDescription, setDetailedJobDescription] = useState<JobDescriptionOut | null>(null);
  const [detailedAnalysisSummary, setDetailedAnalysisSummary] = useState<AnalysisSummaryOut | null>(null);
  const [detailedOverallAtsScore, setDetailedOverallAtsScore] = useState<AnalysisScoreOut | null>(null);
  const [detailedCategoryScores, setDetailedCategoryScores] = useState<Record<string, number> | null>(null);
  const [detailedRecommendations, setDetailedRecommendations] = useState<Record<string, string> | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState<boolean>(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  const fetchAnalysisReports = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setAnalysisReports([]);
      setIsLoadingReports(false);
      return;
    }

    setIsLoadingReports(true);
    setError(null);
    try {
      const reports = await getAnalysisReports(user.id);
      setAnalysisReports(reports);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch analysis reports.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoadingReports(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchAnalysisReports();
    }
  }, [fetchAnalysisReports, isAuthLoading]);

  const handleUpdateStatus = async (reportId: number, newStatus: AnalysisReportStatus) => {
    let toastId: string | number | undefined;
    try {
      toastId = showLoading("Updating status...");
      await updateAnalysisReportStatus(reportId, newStatus);
      showSuccess("Status updated successfully!");
      fetchAnalysisReports(); // Re-fetch to update the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update status.";
      showError(errorMessage);
    } finally {
      if (toastId) dismissToast(toastId);
    }
  };

  const handleViewDetails = async (report: AnalysisReportOut) => {
    setSelectedReport(report);
    setIsViewingDetails(true);
    setIsLoadingDetails(true);
    setDetailedResume(null);
    setDetailedJobDescription(null);
    setDetailedAnalysisSummary(null);
    setDetailedOverallAtsScore(null);
    setDetailedCategoryScores(null);
    setDetailedRecommendations(null);

    let toastId: string | number | undefined;
    try {
      toastId = showLoading("Loading report details...");
      const [resume, jobDescription, summary, allScores, allRecommendations] = await Promise.all([
        getResume(report.resume_id),
        getJobDescription(report.job_description_id),
        getAnalysisSummaryByReportId(report.id),
        getAnalysisScoresByReportId(report.id),
        getAnalysisRecommendationsByReportId(report.id),
      ]);
      setDetailedResume(resume);
      setDetailedJobDescription(jobDescription);
      setDetailedAnalysisSummary(summary);

      const overallScore = allScores.find(s => s.section === "Overall ATS Score");
      setDetailedOverallAtsScore(overallScore || null);

      const categories: Record<string, number> = {};
      allScores.filter(s => s.section !== "Overall ATS Score").forEach(s => {
        categories[s.section] = s.score;
      });
      setDetailedCategoryScores(categories);

      const recommendationsMap: Record<string, string> = {};
      allRecommendations.forEach(rec => {
        recommendationsMap[rec.category] = rec.recommendation_text;
      });
      setDetailedRecommendations(recommendationsMap);

      showSuccess("Report details loaded!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load report details.";
      showError(errorMessage);
      setIsViewingDetails(false); // Close dialog on error
    } finally {
      setIsLoadingDetails(false);
      if (toastId) dismissToast(toastId);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      total: analysisReports.length,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
      not_applied: 0,
    };
    analysisReports.forEach(report => {
      if (report.status in counts) {
        counts[report.status as keyof typeof counts]++;
      }
    });
    return counts;
  };

  const counts = getStatusCounts();

  if (isAuthLoading || isLoadingReports) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-app-blue" />
        <p className="mt-4 text-lg text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-lg text-gray-600">Please log in to view your dashboard.</p>
        <Button onClick={() => window.location.href = '/login'} className="mt-4 bg-app-blue text-white hover:bg-app-blue/90">Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <AppHeader />
        <div className="flex flex-col items-center px-6 py-5 flex-1">
          <h1 className="text-app-dark-text tracking-light text-3xl font-bold leading-tight text-center mb-8">Your Dashboard</h1>

          {error && (
            <div className="w-full max-w-[1000px] p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <p>{error}</p>
            </div>
          )}

          {/* Analytics Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full max-w-[1200px] mb-8">
            <Card className="text-center bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-blue-700">Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-800">{counts.total}</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-green-700">Applied</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-800">{counts.applied}</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-yellow-700">Interviewing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-yellow-800">{counts.interviewing}</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-purple-700">Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-purple-800">{counts.offer}</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-red-700">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-red-800">{counts.rejected}</p>
              </CardContent>
            </Card>
          </div>

          {/* List of Analysis Reports */}
          <div className="w-full max-w-[1200px] bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-app-dark-text text-2xl font-bold mb-4">Your Analysis Reports</h2>
            {analysisReports.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No analysis reports found. Start by using the Resume Analyzer!</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.id}</TableCell>
                        <TableCell>{format(new Date(report.date_created), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="capitalize">
                                {report.status.replace(/_/g, ' ')}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {statusOptions.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onSelect={() => handleUpdateStatus(report.id, status)}
                                  className="capitalize"
                                >
                                  {status.replace(/_/g, ' ')}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(report)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
        <AppFooter />
      </div>

      {/* Report Details Dialog */}
      <Dialog open={isViewingDetails} onOpenChange={setIsViewingDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analysis Report Details (ID: {selectedReport?.id})</DialogTitle>
            <DialogDescription>
              View the original inputs and AI analysis for this report.
            </DialogDescription>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-app-blue" />
              <p className="mt-4 text-gray-600">Loading details...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Original Resume Text</h3>
                <div className="bg-gray-100 p-4 rounded-md border border-gray-200 text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {detailedResume?.summary || 'N/A'}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Original Job Description</h3>
                <div className="bg-gray-100 p-4 rounded-md border border-gray-200 text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {detailedJobDescription?.description || 'N/A'}
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-2">AI Analysis Summary</h3>
                <div className="bg-gray-100 p-4 rounded-md border border-gray-200 text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {detailedAnalysisSummary?.summary_text || 'N/A'}
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-2">Overall ATS Score</h3>
                <div className="bg-gray-100 p-4 rounded-md border border-gray-200 text-sm">
                  <p className="text-2xl font-bold text-app-blue">{detailedOverallAtsScore?.score !== undefined ? `${detailedOverallAtsScore.score}%` : 'N/A'}</p>
                </div>
              </div>
              {(detailedCategoryScores || detailedRecommendations) && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-2">Category Breakdown & Recommendations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detailedCategoryScores && Object.entries(detailedCategoryScores).map(([category, score]) => (
                      <div key={category} className="bg-white p-4 rounded border border-gray-200 text-app-dark-text">
                        <p className="font-medium text-lg capitalize mb-2">{category.replace(/([A-Z])/g, ' $1').trim()}: <span className="text-app-blue font-bold">{score}%</span></p>
                        <p className="text-sm whitespace-pre-wrap">
                          {detailedRecommendations?.[category] || "No specific recommendation provided."}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;