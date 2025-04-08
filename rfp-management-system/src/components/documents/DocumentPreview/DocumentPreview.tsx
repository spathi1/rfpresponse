// src/components/documents/DocumentPreview/DocumentPreview.tsx
import React, { useState, useEffect } from 'react';
import { Document as PDFDocument, Page as PDFPage, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { FiChevronLeft, FiChevronRight, FiDownload, FiZoomIn, FiZoomOut, FiRotateCw } from '../../common/Icons';
import Spinner from '../../common/Spinner/Spinner';
import Button from '../../common/Button/Button';
import { Document } from '../../../types/document.types';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentPreviewProps {
  document: Document;
  pdfUrl: string;
  onDownload?: () => void;
  className?: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  pdfUrl,
  onDownload,
  className = '',
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Handle document load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setIsLoading(false);
  };
  
  // Handle document load error
  const onDocumentLoadError = (error: Error) => {
    setError(`Error loading document: ${error.message}`);
    setIsLoading(false);
  };
  
  // Navigation functions
  const goToPrevPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };
  
  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages || 1));
  };
  
  // Zoom functions
  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };
  
  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };
  
  // Rotation function
  const rotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            icon={<FiChevronLeft />}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={!numPages || pageNumber >= numPages}
            icon={<FiChevronRight />}
          >
            Next
          </Button>
          <div className="mx-2 text-sm text-neutral-700 dark:text-neutral-300">
            Page {pageNumber} of {numPages || '?'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            icon={<FiZoomOut />}
          >
            Zoom Out
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3.0}
            icon={<FiZoomIn />}
          >
            Zoom In
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={rotate}
            icon={<FiRotateCw />}
          >
            Rotate
          </Button>
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              icon={<FiDownload />}
            >
              Download
            </Button>
          )}
        </div>
      </div>
      
      {/* Document preview */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-neutral-200 dark:bg-neutral-900">
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <Spinner size="lg" />
          </div>
        )}
        
        {error && (
          <div className="flex flex-col justify-center items-center h-full text-danger-600 dark:text-danger-400">
            <div className="text-lg font-medium mb-2">Error</div>
            <div className="text-center">{error}</div>
          </div>
        )}
        
        {!error && (
          <PDFDocument
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<Spinner size="lg" />}
            error={<div className="text-danger-600">Failed to load PDF. Please try again.</div>}
            options={{ cMapUrl: `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`, cMapPacked: true }}
          >
            <PDFPage
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg bg-white"
            />
          </PDFDocument>
        )}
      </div>
    </div>
  );
};

export default DocumentPreview;

