import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { RequestListItem } from "@/components/dashboard/request-list-item";
import { Plus } from "lucide-react";
import { useRequests } from "@/hooks/use-requests";
import { RequestContext } from "@/context/request-context";
import { formatDate } from "@/lib/utils";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function MyRequests() {
  const { myRequests } = useRequests();
  const { openNewRequestModal, openRequestDetailsModal } = React.useContext(RequestContext);
  
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 8;
  
  // Handle loading states
  const isLoading = myRequests.isLoading;
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  const requests = myRequests.data || [];
  
  // Calculate pagination
  const totalPages = Math.ceil(requests.length / requestsPerPage);
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = requests.slice(indexOfFirstRequest, indexOfLastRequest);
  
  return (
    <MainLayout>
      <div className="py-6">
        {/* Page Header */}
        <div className="px-4 sm:px-6 md:px-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900">
                Mes demandes
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button
                onClick={openNewRequestModal}
                className="inline-flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle demande
              </Button>
            </div>
          </div>
        </div>
        
        {/* Requests List */}
        <div className="px-4 sm:px-6 md:px-8">
          <div className="bg-white shadow overflow-hidden rounded-md mb-8">
            {requests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Vous n'avez pas encore créé de demandes.</p>
                <Button
                  onClick={openNewRequestModal}
                  className="mt-4"
                  variant="outline"
                >
                  Créer votre première demande
                </Button>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-200">
                  {currentRequests.map((request) => (
                    <RequestListItem
                      key={request.id}
                      id={request.id}
                      ticketId={request.ticketId}
                      title={request.title}
                      status={request.status}
                      date={request.createdAt}
                      requester="Vous"
                      department={request.department}
                      onClick={() => openRequestDetailsModal(request.id)}
                    />
                  ))}
                </ul>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Affichage <span className="font-medium">{((currentPage - 1) * requestsPerPage) + 1}</span>{" "}
                          à{" "}
                          <span className="font-medium">
                            {Math.min(currentPage * requestsPerPage, requests.length)}
                          </span>{" "}
                          sur <span className="font-medium">{requests.length}</span> demandes
                        </p>
                      </div>
                      
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                              className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {[...Array(totalPages)].map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => setCurrentPage(i + 1)}
                                isActive={currentPage === i + 1}
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                              className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
