package com.sabahub.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabahub.domain.Transaction;
import com.sabahub.domain.User;
import com.sabahub.repository.TransactionRepository;
import com.sabahub.service.CurrentUserService;
import com.sabahub.service.PaymentService;
import com.sabahub.service.WalletService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class PaymentControllerTests {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private WalletService walletService;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private CurrentUserService currentUserService;

    @MockBean
    private TransactionRepository transactionRepository;

        // Mock security filter to satisfy context without real JwtService
        // No security filters in MockMvc (addFilters=false)

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void chapaWebhook_withValidSignature_creditsWallet() throws Exception {
        Map<String, Object> payload = Map.of(
                "providerRef", "ref123",
                "userId", "u1",
                "amount", 100.0,
                "currency", "ETB"
        );
        String body = mapper.writeValueAsString(payload);

        given(paymentService.verifyChapaSignature(eq(payload), anyString())).willReturn(true);
        given(transactionRepository.findByProviderAndProviderRef(Transaction.Provider.CHAPA, "ref123"))
                .willReturn(Optional.empty());

        mvc.perform(post("/api/payments/chapa/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Chapa-Signature", "deadbeef")
                        .content(body))
                .andExpect(status().isOk());

        verify(walletService).creditTopUpChapa("u1", 100.0, "ETB", "ref123");
    }

    @Test
    void chapaWebhook_withInvalidSignature_rejected() throws Exception {
        Map<String, Object> payload = Map.of(
                "providerRef", "refX",
                "userId", "u1",
                "amount", 50.0,
                "currency", "ETB"
        );
        String body = mapper.writeValueAsString(payload);

        given(paymentService.verifyChapaSignature(eq(payload), anyString())).willReturn(false);

        mvc.perform(post("/api/payments/chapa/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Chapa-Signature", "bad")
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminVerifyLocal_happyPath() throws Exception {
        // Mock admin user
        User admin = new User();
        admin.setId("admin1");
        given(currentUserService.requireUser()).willReturn(admin);
        // requireRole will be called; leave default behavior

        Transaction tx = new Transaction();
        tx.setId("t1");
        tx.setUserId("u2");
        tx.setProvider(Transaction.Provider.LOCAL);
        tx.setDirection(Transaction.Direction.IN);
        tx.setAmount(75.0);
        tx.setCurrency("ETB");
        tx.setStatus(Transaction.Status.PENDING);
        tx.setProviderRef("bank-slip-42");

        given(transactionRepository.findById("t1")).willReturn(Optional.of(tx));

        Map<String, Object> body = Map.of("transactionId", "t1");

        mvc.perform(post("/api/admin/payments/local/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        verify(walletService).creditTopUpLocal("u2", 75.0, "ETB", "bank-slip-42", "admin1");
    }

    @Test
    void chapaInit_idempotencyKey_reusesTransaction() throws Exception {
        User me = new User();
        me.setId("u100");
        given(currentUserService.requireUser()).willReturn(me);

        Transaction existing = new Transaction();
        existing.setId("tx-abc");
        existing.setUserId("u100");
        existing.setProvider(Transaction.Provider.CHAPA);

        // First call: not found; Second call: found
        given(transactionRepository.findByIdempotencyKey("idem-1"))
                .willReturn(Optional.empty(), Optional.of(existing));

                // Save returns entity with generated id
                given(transactionRepository.save(any(Transaction.class)))
                                .willAnswer(invocation -> {
                                        Transaction t = invocation.getArgument(0);
                                        t.setId("tx-abc");
                                        return t;
                                });

        String body = mapper.writeValueAsString(Map.of("amount", 10.0, "currency", "ETB"));

        // First call creates
        mvc.perform(post("/api/payments/chapa/init")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Idempotency-Key", "idem-1")
                        .content(body))
                .andExpect(status().isOk());

        // Second call returns existing with idempotent flag
        mvc.perform(post("/api/payments/chapa/init")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Idempotency-Key", "idem-1")
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value("tx-abc"))
                .andExpect(jsonPath("$.idempotent").value(true));
    }

    @Test
    void localRequest_idempotencyKey_reusesTransaction() throws Exception {
        User me = new User();
        me.setId("u200");
        given(currentUserService.requireUser()).willReturn(me);

        Transaction existing = new Transaction();
        existing.setId("tx-def");
        existing.setUserId("u200");
        existing.setProvider(Transaction.Provider.LOCAL);

        given(transactionRepository.findByIdempotencyKey("idem-2"))
                .willReturn(Optional.empty(), Optional.of(existing));

        given(transactionRepository.save(any(Transaction.class)))
                .willAnswer(invocation -> {
                    Transaction t = invocation.getArgument(0);
                    t.setId("tx-def");
                    return t;
                });

        String body = mapper.writeValueAsString(Map.of("amount", 15.0, "currency", "ETB", "referenceId", "r1"));

        mvc.perform(post("/api/payments/local/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Idempotency-Key", "idem-2")
                        .content(body))
                .andExpect(status().isOk());

        mvc.perform(post("/api/payments/local/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Idempotency-Key", "idem-2")
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value("tx-def"))
                .andExpect(jsonPath("$.idempotent").value(true));
    }
}
