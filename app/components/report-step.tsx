import { Button } from "@/components/ui/button";
import { useDrawing } from "@/components/ui/drawing-context";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineLine
} from "@/components/ui/timeline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  BarChart2,
  CheckCircle,
  Download,
  FileCheck,
  X
} from "lucide-react";
import React, { useRef, useState } from "react";

interface ProjectData {
  name: string;
  description: string;
  location: string;
  documentUrl: string;
}

interface ReportStepProps {
  onProceedToVerification: () => void;
}

const ReportStep: React.FC<ReportStepProps> = ({ onProceedToVerification }) => {
  const { carbonMetrics } = useDrawing();
  const [projectData, setProjectData] = useState<ProjectData>({
    name: "",
    description: "",
    location: "",
    documentUrl: ""
  });
  
  const [reportGenerated, setReportGenerated] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [reportDocuments, setReportDocuments] = useState({
    mitigationPlan: false,
    validationReport: false,
    achievementReport: false,
    verificationReport: false,
    rsVerification: false
  });

  // Ref for the PDF content
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Calculate carbon pricing
  const carbonPricing = carbonMetrics?.marketableCredits ? carbonMetrics.marketableCredits : 0;

  const handleProjectDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleGenerateReport = () => {
    // This would actually generate the reports in a real implementation
    setReportGenerated(true);
    setReportDocuments({
      mitigationPlan: true,
      validationReport: true,
      achievementReport: true,
      verificationReport: false,
      rsVerification: false
    });
  };
  
  const handleUploadDocument = () => {
    // In a real app, this would open a file picker
    alert("Document uploaded successfully!");
  };
  
  const handleViewDocument = () => {
    setShowPdfPreview(true);
  };
  
  const handleClosePdfPreview = () => {
    setShowPdfPreview(false);
  };

  // Function to download PDF
  const handleDownloadPDF = async () => {
    if (!pdfContentRef.current) return;
    
    try {
      setDownloading(true);
      
      const content = pdfContentRef.current;
      const canvas = await html2canvas(content, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let position = 0;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      
      // If content is taller than one page
      let heightLeft = imgHeight;
      const pageHeight = 295; // A4 height in mm
      
      while (heightLeft > pageHeight) {
        position = heightLeft - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      const fileName = `${projectData.name || 'Carbon_Project'}_Report_${new Date().toISOString().slice(0,10)}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // PDF Report Preview Component
  const PdfPreview = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-md shadow-lg w-full max-w-4xl h-5/6 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold">Carbon Project Comparative Analysis: 2017-2024</h3>
            <Button variant="ghost" size="sm" onClick={handleClosePdfPreview}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div ref={pdfContentRef} className="max-w-3xl mx-auto space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Carbon Stock Comparative Analysis</h1>
                <p className="text-sm text-gray-600">Report generated: {new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="border-t pt-4">
                <h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
                <p>
                  This report provides a comprehensive analysis of carbon stock changes between 2017 and 2024 
                  for the selected area. The analysis is based on remote sensing data and field measurements, 
                  providing insights into carbon sequestration, leakage risks, and overall carbon credit potential.
                </p>
              </div>
              
              <div className="border-t pt-4">
                <h2 className="text-xl font-semibold mb-4">Project Overview</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Project Name</h3>
                    <p>{projectData.name || 'Carbon Sequestration Project'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p>{projectData.location || 'Riau, Indonesia'}</p>
                  </div>
                  <div className="col-span-2">
                    <h3 className="font-medium">Project Description</h3>
                    <p>{projectData.description || 'Forest conservation and restoration project aimed at reducing carbon emissions and enhancing carbon sequestration through sustainable forest management practices.'}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h2 className="text-xl font-semibold mb-4">Carbon Stock Comparison</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Metric</th>
                        <th className="border p-2 text-right">2017 Value</th>
                        <th className="border p-2 text-right">2024 Value</th>
                        <th className="border p-2 text-right">Change</th>
                        <th className="border p-2 text-right">% Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">Total Carbon Stock (tCO₂e)</td>
                        <td className="border p-2 text-right">{(carbonMetrics?.carbonStocks || 0) - (carbonMetrics?.forestGrowth || 0)}</td>
                        <td className="border p-2 text-right">{carbonMetrics?.carbonStocks || 0}</td>
                        <td className="border p-2 text-right">{carbonMetrics?.forestGrowth || 0}</td>
                        <td className="border p-2 text-right">
                          {carbonMetrics?.forestGrowth && carbonMetrics?.carbonStocks && carbonMetrics.carbonStocks !== carbonMetrics.forestGrowth
                            ? ((carbonMetrics.forestGrowth / (carbonMetrics.carbonStocks - carbonMetrics.forestGrowth)) * 100).toFixed(2)
                            : '0.00'}%
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border p-2">Forest Coverage (ha)</td>
                        <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.8 / 10000).toFixed(2)}</td>
                        <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.9 / 10000).toFixed(2)}</td>
                        <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.1 / 10000).toFixed(2)}</td>
                        <td className="border p-2 text-right">12.50%</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Carbon Density (tCO₂e/ha)</td>
                        <td className="border p-2 text-right">
                          {carbonMetrics?.area 
                            ? (((carbonMetrics.carbonStocks - carbonMetrics.forestGrowth) / (carbonMetrics.area * 0.8 / 10000))).toFixed(2)
                            : '0.00'}
                        </td>
                        <td className="border p-2 text-right">
                          {carbonMetrics?.area 
                            ? ((carbonMetrics.carbonStocks / (carbonMetrics.area * 0.9 / 10000))).toFixed(2)
                            : '0.00'}
                        </td>
                        <td className="border p-2 text-right">
                          {carbonMetrics?.area 
                            ? (((carbonMetrics.carbonStocks / (carbonMetrics.area * 0.9 / 10000)) - 
                               ((carbonMetrics.carbonStocks - carbonMetrics.forestGrowth) / (carbonMetrics.area * 0.8 / 10000)))).toFixed(2)
                            : '0.00'}
                        </td>
                        <td className="border p-2 text-right">
                          {carbonMetrics?.area && carbonMetrics?.forestGrowth && carbonMetrics?.carbonStocks
                            ? ((((carbonMetrics.carbonStocks / (carbonMetrics.area * 0.9 / 10000)) - 
                                ((carbonMetrics.carbonStocks - carbonMetrics.forestGrowth) / (carbonMetrics.area * 0.8 / 10000))) / 
                                ((carbonMetrics.carbonStocks - carbonMetrics.forestGrowth) / (carbonMetrics.area * 0.8 / 10000))) * 100).toFixed(2)
                            : '0.00'}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h2 className="text-xl font-semibold mb-4">Land Use Change Analysis</h2>
                <div className="space-y-2">
                  <p>
                    Between 2017 and 2024, the project area underwent significant changes in land use and land cover patterns.
                    The analysis reveals a net increase in forest cover, primarily due to reforestation efforts and natural regeneration.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">Land Use Class</th>
                          <th className="border p-2 text-right">2017 (ha)</th>
                          <th className="border p-2 text-right">2024 (ha)</th>
                          <th className="border p-2 text-right">Change (ha)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2">Trees</td>
                          <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.65 / 10000).toFixed(2)}</td>
                          <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.75 / 10000).toFixed(2)}</td>
                          <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.1 / 10000).toFixed(2)}</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border p-2">Flooded Vegetation</td>
                          <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.15 / 10000).toFixed(2)}</td>
                          <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.15 / 10000).toFixed(2)}</td>
                          <td className="border p-2 text-right">0.00</td>
                        </tr>
                        <tr>
                          <td className="border p-2">Crops</td>
                          <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.10 / 10000).toFixed(2)}</td>
                          <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.05 / 10000).toFixed(2)}</td>
                          <td className="border p-2 text-right">-{((carbonMetrics?.area || 0) * 0.05 / 10000).toFixed(2)}</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border p-2">Built Area</td>
                          <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.05 / 10000).toFixed(2)}</td>
                          <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.03 / 10000).toFixed(2)}</td>
                          <td className="border p-2 text-right">-{((carbonMetrics?.area || 0) * 0.02 / 10000).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="border p-2">Bare Ground</td>
                          <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.05 / 10000).toFixed(2)}</td>
                          <td className="border p-2 text-right">{((carbonMetrics?.area || 0) * 0.02 / 10000).toFixed(2)}</td>
                          <td className="border p-2 text-right">-{((carbonMetrics?.area || 0) * 0.03 / 10000).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h2 className="text-xl font-semibold mb-4">Carbon Credit Potential</h2>
                <p>
                  Based on the analysis, the potential carbon credits that can be generated from this project are:
                </p>
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-green-800">Total Net Sequestration</h3>
                      <p className="text-sm text-green-700">After accounting for leakage and permanence risks</p>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {carbonMetrics?.netSequestration || 0} tCO₂e
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h2 className="text-xl font-semibold mb-4">Carbon Valuation</h2>
                <p>
                  Based on the current carbon price of Rp 96,000 per tCO₂e, the estimated financial value 
                  of the carbon credits generated by this project is:
                </p>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-blue-800">Total Carbon Credit Value</h3>
                      <p className="text-sm text-blue-700">Current market rate: Rp 96,000 per tCO₂e</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-700 flex items-center">
                      Rp {carbonPricing.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-700">Net Sequestration</span>
                      <span className="text-blue-700">{carbonMetrics?.netSequestration || 0} tCO₂e</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-700">Price per Credit</span>
                      <span className="text-blue-700">Rp 96,000</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h2 className="text-xl font-semibold mb-4">Conclusion</h2>
                <p>
                  The project demonstrates significant carbon sequestration potential with a net positive change in 
                  carbon stocks between 2017 and 2024. The estimated {carbonMetrics?.netSequestration || 0} tCO₂e 
                  of marketable carbon credits represent a valuable contribution to climate change mitigation efforts.
                </p>
                <p className="mt-2">
                  With a total estimated value of Rp {carbonPricing.toLocaleString()}, this project not only 
                  provides environmental benefits but also represents a significant financial opportunity.
                  The next step is to proceed with verification of these findings through independent third-party 
                  verification to confirm the accuracy of measurements and calculations.
                </p>
              </div>
            </div>
          </div>
          <div className="border-t p-4 flex justify-end">
            <Button 
              className="flex items-center gap-2"
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  <span>Download PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {showPdfPreview && <PdfPreview />}
      <Timeline positions="left" className="space-y-4">
        <TimelineItem status="done">
          <TimelineDot status="done" />
          <TimelineLine done className="min-h-4" />
          <TimelineContent side="right" className="w-full py-2">
            <div className="text-sm text-gray-500">Measurement completed</div>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem status={"default"}>
          <TimelineDot status="current" />
          <TimelineLine done className="min-h-4" />
          <TimelineContent side="right" className="w-full space-y-2 py-2">
            {!reportGenerated ? (
              <div className="space-y-4">
                <div className="prose space-y-2 text-sm">
                  <p>
                    Please provide your carbon project information to generate the required reports.
                  </p>
                </div>
                
                <div className="space-y-2 rounded-md border p-2 bg-green-50">
                  <div className="font-medium text-sm">Carbon Project Document</div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Project Name</div>
                    <Input 
                      name="name"
                      value={projectData.name}
                      onChange={handleProjectDataChange}
                      placeholder="Enter project name"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Project Location</div>
                    <Input 
                      name="location"
                      value={projectData.location}
                      onChange={handleProjectDataChange}
                      placeholder="Enter project location"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Project Description</div>
                    <Textarea 
                      name="description"
                      value={projectData.description}
                      onChange={handleProjectDataChange}
                      placeholder="Describe your carbon project"
                      className="text-sm"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-center p-4">
                  <div className="flex items-center justify-center rounded-full bg-amber-100 p-2">
                    <BarChart2 className="size-6 text-amber-600" />
                  </div>
                </div>
                <div className="text-center text-sm font-medium">Carbon Stock Temporal Monitoring</div>
                <p className="text-sm text-center text-gray-500">
                  Our AI will monitor your project's carbon stocks over time
                </p>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={handleGenerateReport} 
                        className="w-full"
                        disabled={!projectData.name || !projectData.location || !projectData.description}
                      >
                        Generate AI-based Reports
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create AI-generated reports based on your project information</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="prose space-y-2 text-sm">
                  <p>
                    Your reports have been generated using our Generative AI-based Reporting system. The following documents are available:
                  </p>
                </div>
                
                <div className="space-y-2 rounded-md border p-2 bg-orange-50">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <div className="flex items-center justify-center bg-orange-500 text-white rounded-full w-6 h-6 text-xs"></div>
                    Automated Reporting System
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Generated based on your project data</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8" onClick={handleViewDocument}>
                            <FileCheck className="size-4 mr-1" /> View
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View document details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={onProceedToVerification} 
                        className="w-full flex items-center gap-2"
                      >
                        <CheckCircle className="size-4" />
                        <span>Proceed to Verification</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Submit your project for verification and validation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    </>
  );
};

export default ReportStep;