package com.sabahub.repository;

import com.sabahub.domain.Invoice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends MongoRepository<Invoice, String> {
    
    List<Invoice> findByFreelancerId(String freelancerId);
    
    List<Invoice> findByContractId(String contractId);
    
    @Query("{ 'freelancerId': ?0, 'status': ?1 }")
    List<Invoice> findByFreelancerIdAndStatus(String freelancerId, String status);
    
    @Query("{ 'status': 'OVERDUE' }")
    List<Invoice> findOverdueInvoices();
}
