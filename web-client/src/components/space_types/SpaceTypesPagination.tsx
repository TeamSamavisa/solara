import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '../ui/button';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

interface SpaceTypesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}

export const SpaceTypesPagination: React.FC<SpaceTypesPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  hasNextPage,
  hasPrevPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 px-2">
      <div className="text-sm text-gray-600 dark:text-muted-foreground">
        Mostrando{' '}
        <span className="font-medium dark:text-foreground">{startItem}</span> a{' '}
        <span className="font-medium dark:text-foreground">{endItem}</span> de{' '}
        <span className="font-medium dark:text-foreground">{totalItems}</span>{' '}
        resultados
      </div>

      <Pagination>
        <PaginationContent>
          {/* First Page Button */}
          <PaginationItem>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(1)}
              disabled={!hasPrevPage}
              title="Primeira página"
              aria-label="Ir para primeira página"
              className="dark:bg-secondary dark:text-secondary-foreground dark:border-border dark:hover:bg-secondary/80"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>

          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault();
                if (hasPrevPage) onPageChange(currentPage - 1);
              }}
              aria-disabled={!hasPrevPage}
              className={
                !hasPrevPage
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground'
              }
            />
          </PaginationItem>

          {/* Page Numbers (desktop) */}
          <div className="hidden sm:contents">
            {getVisiblePages().map((page, index) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis className="dark:text-muted-foreground" />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(page);
                    }}
                    isActive={page === currentPage}
                    className={
                      page === currentPage
                        ? 'bg-[var(--solara-800)] hover:bg-[var(--solara-800)] text-white dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 cursor-pointer'
                        : 'cursor-pointer dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground'
                    }
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
          </div>

          {/* Mobile Indicator */}
          <PaginationItem className="sm:hidden">
            <span className="text-sm text-gray-600 dark:text-muted-foreground">
              Página <span className="dark:text-foreground">{currentPage}</span>{' '}
              de <span className="dark:text-foreground">{totalPages}</span>
            </span>
          </PaginationItem>

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              onClick={(e) => {
                e.preventDefault();
                if (hasNextPage) onPageChange(currentPage + 1);
              }}
              aria-disabled={!hasNextPage}
              className={
                !hasNextPage
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground'
              }
            />
          </PaginationItem>

          {/* Last Page Button */}
          <PaginationItem>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(totalPages)}
              disabled={!hasNextPage}
              title="Última página"
              aria-label="Ir para última página"
              className="dark:bg-secondary dark:text-secondary-foreground dark:border-border dark:hover:bg-secondary/80"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
