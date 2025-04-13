import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RequestListItem } from "@/components/dashboard/request-list-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Plus 
} from "lucide-react";
import { useRequests } from "@/hooks/use-requests";
import { RequestContext } from "@/context/request-context";
import { formatDate } from "@/lib/utils";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function Dashboard() {
  const { allRequests, myRequests, toApprove, stats } = useRequests();
  const { openNewRequestModal, openRequestDetailsModal } = React.useContext(RequestContext);
  
  const [currentTab, setCurrentTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 5;
  
  // Handle loading states
  const isLoading = allRequests.isLoading || stats.isLoading;
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  // Get the appropriate requests based on the selected tab
  const getTabRequests = () => {
    switch (currentTab) {
      case "pending":
        return allRequests.data?.filter((req: any) => req.status === "pending_approval") || [];
      case "all":
        return allRequests.data || [];
      case "my":
        return myRequests.data || [];
      default:
        return [];
    }
  };
  
  const requests = getTabRequests();
  
  // Calculate pagination
  const totalPages = Math.ceil(requests.length / requestsPerPage);
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = requests.slice(indexOfFirstRequest, indexOfLastRequest);
  
  return (
    <MainLayout>
      <div className="py-6">
        {/* Dashboard Header */}
        <div className="px-4 sm:px-6 md:px-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900">
                Dashboard
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button
                onClick={openNewRequestModal}
                className="inline-flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="px-4 sm:px-6 md:px-8 mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Requests"
            value={stats.data?.total || 0}
            icon={FileText}
            iconClassName="bg-blue-100 text-blue-600"
          />
          <StatsCard
            title="Pending Approval"
            value={stats.data?.pendingApproval || 0}
            icon={Clock}
            iconClassName="bg-amber-100 text-amber-600"
          />
          <StatsCard
            title="Approved"
            value={stats.data?.approved || 0}
            icon={CheckCircle2}
            iconClassName="bg-green-100 text-green-600"
          />
          <StatsCard
            title="Rejected"
            value={stats.data?.rejected || 0}
            icon={XCircle}
            iconClassName="bg-red-100 text-red-600"
          />
        </div>
        
        {/* Requests Tabs */}
        <div className="px-4 sm:px-6 md:px-8">
          <Tabs defaultValue="pending" onValueChange={setCurrentTab}>
            <TabsList className="mb-5 border-b border-gray-200 w-full justify-start">
              <TabsTrigger value="pending">Pending Action</TabsTrigger>
              <TabsTrigger value="all">All Requests</TabsTrigger>
              <TabsTrigger value="my">My Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-0">
              <RequestsList
                requests={currentRequests}
                openDetails={openRequestDetailsModal}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={requests.length}
                itemsPerPage={requestsPerPage}
                onPageChange={setCurrentPage}
              />
            </TabsContent>
            
            <TabsContent value="all" className="mt-0">
              <RequestsList
                requests={currentRequests}
                openDetails={openRequestDetailsModal}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={requests.length}
                itemsPerPage={requestsPerPage}
                onPageChange={setCurrentPage}
              />
            </TabsContent>
            
            <TabsContent value="my" className="mt-0">
              <RequestsList
                requests={currentRequests}
                openDetails={openRequestDetailsModal}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={requests.length}
                itemsPerPage={requestsPerPage}
                onPageChange={setCurrentPage}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}

function RequestsList({
  requests,
  openDetails,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  requests: any[];
  openDetails: (id: number) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  if (!requests || requests.length === 0) {
    return (
      <div className="bg-white shadow rounded-md p-6 text-center text-gray-500">
        No requests found.
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow overflow-hidden rounded-md mb-8">
      <ul className="divide-y divide-gray-200">
        {requests.map((request) => (
          <RequestListItem
            key={request.id}
            id={request.id}
            ticketId={request.ticketId}
            title={request.title}
            status={request.status}
            date={request.createdAt}
            requester={request.requesterName || "Unknown User"}
            department={request.department}
            onClick={() => openDetails(request.id)}
          />
        ))}
      </ul>
      
      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> requests
            </p>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => onPageChange(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
