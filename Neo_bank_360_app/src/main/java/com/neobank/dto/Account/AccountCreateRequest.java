package com.neobank.dto.Account;

import com.neobank.enums.AccountType;
import java.math.BigDecimal;
import java.time.LocalDate;

public class AccountCreateRequest {

    private AccountType accountType;
    private BigDecimal initialDeposit;

    // ─── Bank-style opening details (optional) ───
    private String purpose;
    private String nomineeName;
    private String nomineeRelation;
    private LocalDate nomineeDob;
    private String communicationMode; // EMAIL | SMS | BOTH
    private String occupation;
    private String employmentStatus;  // SALARIED | SELF_EMPLOYED | STUDENT | RETIRED | OTHER
    private String branchPreference;
    private Boolean debitCardRequired;
    private Boolean chequeBookRequired;
    private Boolean netBankingRequired;
    private Boolean acceptedTerms;

    public AccountType getAccountType() { return accountType; }
    public void setAccountType(AccountType accountType) { this.accountType = accountType; }

    public BigDecimal getInitialDeposit() { return initialDeposit; }
    public void setInitialDeposit(BigDecimal initialDeposit) { this.initialDeposit = initialDeposit; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getNomineeName() { return nomineeName; }
    public void setNomineeName(String nomineeName) { this.nomineeName = nomineeName; }

    public String getNomineeRelation() { return nomineeRelation; }
    public void setNomineeRelation(String nomineeRelation) { this.nomineeRelation = nomineeRelation; }

    public LocalDate getNomineeDob() { return nomineeDob; }
    public void setNomineeDob(LocalDate nomineeDob) { this.nomineeDob = nomineeDob; }

    public String getCommunicationMode() { return communicationMode; }
    public void setCommunicationMode(String communicationMode) { this.communicationMode = communicationMode; }

    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }

    public String getEmploymentStatus() { return employmentStatus; }
    public void setEmploymentStatus(String employmentStatus) { this.employmentStatus = employmentStatus; }

    public String getBranchPreference() { return branchPreference; }
    public void setBranchPreference(String branchPreference) { this.branchPreference = branchPreference; }

    public Boolean getDebitCardRequired() { return debitCardRequired; }
    public void setDebitCardRequired(Boolean debitCardRequired) { this.debitCardRequired = debitCardRequired; }

    public Boolean getChequeBookRequired() { return chequeBookRequired; }
    public void setChequeBookRequired(Boolean chequeBookRequired) { this.chequeBookRequired = chequeBookRequired; }

    public Boolean getNetBankingRequired() { return netBankingRequired; }
    public void setNetBankingRequired(Boolean netBankingRequired) { this.netBankingRequired = netBankingRequired; }

    public Boolean getAcceptedTerms() { return acceptedTerms; }
    public void setAcceptedTerms(Boolean acceptedTerms) { this.acceptedTerms = acceptedTerms; }
}
