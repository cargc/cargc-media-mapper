"use client";

import { useState } from "react";
import { MediaLocation } from "@/lib/airtable/types";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Download } from "lucide-react";
import { columns } from "@/components/media-locations-table/columns";
import { exportToCSV } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface MediaTableProps {
  data: MediaLocation[];
  onRowClick?: (mediaPoint: MediaLocation) => void;
}

export function MediaTable({ data }: MediaTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
  });

  return (
    <div className="space-y-4">
      {/* Search and Export Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Search media locations..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className="max-w-md h-12"
          aria-label="Search media locations"
        />
        <Button
          onClick={() => exportToCSV(table.getFilteredRowModel().rows)}
          variant="outline"
          className="flex items-center gap-2"
          aria-label="Export table data as CSV file"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Results Count */}
      <div
        className="text-sm text-muted-foreground"
        aria-live="polite"
        aria-label="Search results count"
      >
        Showing {table.getRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} results
        {table.getFilteredRowModel().rows.length !== data.length &&
          ` (filtered from ${data.length} total)`}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table aria-label="Media locations table" role="table">
          <caption className="sr-only">
            Table showing media locations with details including title, media type,
           location, and tags. Click column headers to
            sort. Click location links to view details on the map.
          </caption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-gray-50 dark:bg-gray-900"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="py-4"
                    scope="col"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found. Try adjusting your search terms.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        {/* Rows per page - Hidden on mobile, shown on desktop */}
        <div className="hidden sm:flex items-center space-x-2">
          <Label htmlFor="desktop-page-size">Rows per page</Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger
              id="desktop-page-size"
              size="sm"
              className="w-[70px]"
            >
              <SelectValue aria-label="Select number of rows to display per page" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page info - Centered on mobile, positioned on desktop */}
        <div className="flex items-center justify-center sm:justify-start">
          <div className="flex items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
        </div>

        {/* Pagination controls - Optimized for mobile */}
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  aria-disabled={!table.getCanPreviousPage()}
                />
              </PaginationItem>

              {/* Desktop: Show page numbers */}
              {Array.from(
                { length: Math.min(5, table.getPageCount()) },
                (_, i) => {
                  const currentPage = table.getState().pagination.pageIndex;
                  const totalPages = table.getPageCount();
                  let pageNumber;

                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage < 3) {
                    pageNumber = i + 1;
                  } else if (currentPage > totalPages - 3) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 1 + i;
                  }

                  return (
                    <PaginationItem
                      key={pageNumber}
                      className="hidden sm:block"
                    >
                      <PaginationLink
                        onClick={() => table.setPageIndex(pageNumber - 1)}
                        isActive={pageNumber === currentPage + 1}
                        className="cursor-pointer min-w-[40px] h-10"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  aria-disabled={!table.getCanNextPage()}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        {/* Mobile-only rows per page selector */}
        <div className="flex sm:hidden items-center justify-center space-x-2 pt-2 border-t">
          <Label htmlFor="mobile-page-size">Rows per page:</Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger id="mobile-page-size" className="w-[80px]">
              <SelectValue aria-label="Select number of rows to display per page" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
