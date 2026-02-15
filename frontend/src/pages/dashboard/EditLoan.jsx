import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchLoan, updateLoan } from '../../store/slices/loansSlice'
import TextField from '../../components/TextField'
import Select from '../../components/Select'
import Snackbar from '../../components/Snackbar'
import DetailsSkeleton from '../../components/dashboard/DetailsSkeleton'
import { ASSAM_DISTRICTS } from '../../constants/assamDistricts'
import { RELATIONSHIPS } from '../../constants/relationships'
import { LOAN_PURPOSES } from '../../constants/loanPurposes'
import './EditLoan.scss'

const emptyAddress = () => ({ village: '', postOffice: '', policeStation: '', district: '', pinCode: '', landmark: '' })

const Section = ({ number, title, description, children }) => (
  <div className="form-section">
    <div className="section-header">
      <div className="section-number">{number}</div>
      <div className="section-title-group">
        <h2>{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
    </div>
    <div className="form-grid">{children}</div>
  </div>
)

const AddrFields = ({ prefix, form, set, formErrors }) => {
  const a = form?.[prefix]?.address || emptyAddress()
  return (
    <>
      <TextField label="Village/Ward" value={a.village} onChange={(e) => set(`${prefix}.address.village`, e.target.value)} error={formErrors[`${prefix}.address.village`]} required />
      <TextField label="Post Office" value={a.postOffice} onChange={(e) => set(`${prefix}.address.postOffice`, e.target.value)} error={formErrors[`${prefix}.address.postOffice`]} required />
      <TextField label="Police Station" value={a.policeStation} onChange={(e) => set(`${prefix}.address.policeStation`, e.target.value)} required />
      <Select label="District" value={a.district} onChange={(e) => set(`${prefix}.address.district`, e.target.value)} options={ASSAM_DISTRICTS} required />
      <TextField label="PIN Code" value={a.pinCode} onChange={(e) => set(`${prefix}.address.pinCode`, e.target.value)} maxLength={6} error={formErrors[`${prefix}.address.pinCode`]} required />
      <TextField label="Landmark" value={a.landmark} onChange={(e) => set(`${prefix}.address.landmark`, e.target.value)} />
    </>
  )
}

const initFormFromLoan = (loan) => {
  if (!loan) return null
  return {
    mobileNumber: loan.mobileNumber ?? '',
    email: loan.email ?? '',
    loanAmount: loan.loanAmount ?? '',
    loanTenure: loan.loanTenure ?? '',
    purpose: loan.purpose ?? '',
    installmentAmount: loan.installmentAmount ?? '',
    bankAccountNumber: loan.bankAccountNumber ?? '',
    status: loan.status ?? 'active',
    nominee: loan.nominee ? {
      name: loan.nominee.name ?? '',
      relationship: loan.nominee.relationship ?? '',
      mobileNumber: loan.nominee.mobileNumber ?? '',
      bankAccountNumber: loan.nominee.bankAccountNumber ?? '',
      address: loan.nominee.address ? { ...emptyAddress(), ...loan.nominee.address } : emptyAddress(),
    } : { name: '', relationship: '', mobileNumber: '', bankAccountNumber: '', address: emptyAddress() },
    guarantor: loan.guarantor ? {
      name: loan.guarantor.name ?? '',
      fatherOrHusbandName: loan.guarantor.fatherOrHusbandName ?? '',
      relationship: loan.guarantor.relationship ?? '',
      mobileNumber: loan.guarantor.mobileNumber ?? '',
      bankAccountNumber: loan.guarantor.bankAccountNumber ?? '',
      address: loan.guarantor.address ? { ...emptyAddress(), ...loan.guarantor.address } : emptyAddress(),
    } : { name: '', fatherOrHusbandName: '', relationship: '', mobileNumber: '', bankAccountNumber: '', address: emptyAddress() },
    coApplicant: loan.coApplicant ? {
      fullName: loan.coApplicant.fullName ?? '',
      fatherOrHusbandName: loan.coApplicant.fatherOrHusbandName ?? '',
      mobileNumber: loan.coApplicant.mobileNumber ?? '',
      email: loan.coApplicant.email ?? '',
      address: loan.coApplicant.address ? { ...emptyAddress(), ...loan.coApplicant.address } : emptyAddress(),
    } : null,
  }
}

const EditLoan = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const selectedLoan = useAppSelector((state) => state.loans.selectedLoan)
  const isLoading = useAppSelector((state) => state.loans.isLoading)
  const error = useAppSelector((state) => state.loans.error)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (id) dispatch(fetchLoan(id))
  }, [id, dispatch])

  useEffect(() => {
    if (selectedLoan && !form) setForm(initFormFromLoan(selectedLoan))
  }, [selectedLoan, form])

  const detailPath = `/dashboard/loans/${id}`

  const set = (path, value) => {
    setForm((prev) => {
      if (!prev) return prev
      const next = JSON.parse(JSON.stringify(prev))
      const parts = path.split('.')
      let cur = next
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i]
        if (!(key in cur)) cur[key] = {}
        cur = cur[key]
      }
      cur[parts[parts.length - 1]] = value
      return next
    })
    if (formErrors[path]) setFormErrors((e) => ({ ...e, [path]: '' }))
  }

  const validate = () => {
    const err = {}
    if (!form.mobileNumber?.trim()) err.mobileNumber = 'Required'
    else if (!/^\d{10}$/.test(form.mobileNumber.trim())) err.mobileNumber = 'Must be 10 digits'
    if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) err.email = 'Invalid email'
    if (!form.loanAmount || Number(form.loanAmount) <= 0) err.loanAmount = 'Must be greater than 0'
    if (!form.loanTenure || Number(form.loanTenure) < 1) err.loanTenure = 'Required'
    if (!form.purpose?.trim()) err.purpose = 'Required'
    if (!form.installmentAmount || Number(form.installmentAmount) <= 0) err.installmentAmount = 'Must be greater than 0'
    if (form.nominee) {
      if (!form.nominee.name?.trim()) err['nominee.name'] = 'Required'
      if (!form.nominee.relationship?.trim()) err['nominee.relationship'] = 'Required'
      if (!form.nominee.mobileNumber?.trim()) err['nominee.mobileNumber'] = 'Required'
      else if (!/^\d{10}$/.test(form.nominee.mobileNumber.trim())) err['nominee.mobileNumber'] = '10 digits'
      const a = form.nominee.address
      if (a && (!a.village?.trim() || !a.postOffice?.trim() || !a.pinCode?.trim())) {
        if (!a.village?.trim()) err['nominee.address.village'] = 'Required'
        if (!a.postOffice?.trim()) err['nominee.address.postOffice'] = 'Required'
        if (!a.pinCode?.trim()) err['nominee.address.pinCode'] = 'Required'
      }
    }
    if (form.guarantor) {
      if (!form.guarantor.name?.trim()) err['guarantor.name'] = 'Required'
      if (!form.guarantor.mobileNumber?.trim()) err['guarantor.mobileNumber'] = 'Required'
      else if (!/^\d{10}$/.test(form.guarantor.mobileNumber.trim())) err['guarantor.mobileNumber'] = '10 digits'
    }
    if (form.coApplicant) {
      if (!form.coApplicant.fullName?.trim()) err['coApplicant.fullName'] = 'Required'
      if (!form.coApplicant.mobileNumber?.trim()) err['coApplicant.mobileNumber'] = 'Required'
      else if (!/^\d{10}$/.test(form.coApplicant.mobileNumber.trim())) err['coApplicant.mobileNumber'] = '10 digits'
    }
    setFormErrors(err)
    return Object.keys(err).length === 0
  }

  const buildPayload = () => {
    const payload = {
      mobileNumber: form.mobileNumber?.trim(),
      email: form.email?.trim() || '',
      loanAmount: Number(form.loanAmount),
      loanTenure: Number(form.loanTenure),
      purpose: form.purpose?.trim(),
      installmentAmount: Number(form.installmentAmount),
      bankAccountNumber: form.bankAccountNumber?.trim() || '',
      nominee: form.nominee ? {
        name: form.nominee.name?.trim(),
        relationship: form.nominee.relationship?.trim(),
        mobileNumber: form.nominee.mobileNumber?.trim(),
        bankAccountNumber: form.nominee.bankAccountNumber?.trim() || '',
        address: form.nominee.address,
      } : undefined,
      guarantor: form.guarantor ? {
        name: form.guarantor.name?.trim(),
        fatherOrHusbandName: form.guarantor.fatherOrHusbandName?.trim(),
        relationship: form.guarantor.relationship?.trim(),
        mobileNumber: form.guarantor.mobileNumber?.trim(),
        bankAccountNumber: form.guarantor.bankAccountNumber?.trim() || '',
        address: form.guarantor.address,
      } : undefined,
      coApplicant: form.coApplicant && form.coApplicant.fullName ? {
        fullName: form.coApplicant.fullName?.trim(),
        fatherOrHusbandName: form.coApplicant.fatherOrHusbandName?.trim(),
        mobileNumber: form.coApplicant.mobileNumber?.trim(),
        email: form.coApplicant.email?.trim() || '',
        address: form.coApplicant.address,
      } : null,
    }
    return payload
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form || !validate()) return
    setSaving(true)
    try {
      const result = await dispatch(updateLoan({ id, loanData: buildPayload() }))
      if (updateLoan.fulfilled.match(result)) {
        navigate(detailPath)
      }
    } finally {
      setSaving(false)
    }
  }

  if (isLoading && !selectedLoan) {
    return (
      <div className="edit-loan-page">
        <div className="page-header">
          <div>
            <button type="button" className="back-button" onClick={() => navigate(detailPath)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <h1 className="page-title">Edit Loan</h1>
          </div>
        </div>
        <DetailsSkeleton />
        <Snackbar />
      </div>
    )
  }

  if (error && !selectedLoan) {
    return (
      <div className="edit-loan-page">
        <div className="page-header">
          <div>
            <button type="button" className="back-button" onClick={() => navigate('/dashboard/loans')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <h1 className="page-title">Edit Loan</h1>
          </div>
        </div>
        <div className="error-state"><p>{error}</p><button className="btn-primary" onClick={() => navigate('/dashboard/loans')}>Back to Loans</button></div>
        <Snackbar />
      </div>
    )
  }

  if (!selectedLoan || !form) return null

  return (
    <div className="edit-loan-page">
      <div className="page-header">
        <div>
          <button type="button" className="back-button" onClick={() => navigate(detailPath)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
          <h1 className="page-title">Edit Loan</h1>
          <p className="page-subtitle">{selectedLoan.loanAccountNumber} – {selectedLoan.membership?.fullName}</p>
        </div>
      </div>
      <form className="edit-loan-form" onSubmit={handleSubmit}>
        <Section number="01" title="Loan & Contact" description="Update loan and contact details">
          <TextField label="Mobile Number" name="mobileNumber" value={form.mobileNumber} onChange={(e) => set('mobileNumber', e.target.value)} error={formErrors.mobileNumber} required maxLength={10} />
          <TextField label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={formErrors.email} />
          <TextField label="Loan Amount" type="number" value={form.loanAmount} onChange={(e) => set('loanAmount', e.target.value)} error={formErrors.loanAmount} required />
          <TextField label="Tenure (days)" type="number" value={form.loanTenure} onChange={(e) => set('loanTenure', e.target.value)} error={formErrors.loanTenure} required />
          <Select label="Purpose" value={form.purpose} onChange={(e) => set('purpose', e.target.value)} options={LOAN_PURPOSES.map((p) => ({ value: p, label: p }))} required />
          <TextField label="Installment Amount" type="number" value={form.installmentAmount} onChange={(e) => set('installmentAmount', e.target.value)} error={formErrors.installmentAmount} required />
          <TextField label="Bank Account Number" value={form.bankAccountNumber} onChange={(e) => set('bankAccountNumber', e.target.value)} />
        </Section>

        <Section number="02" title="Nominee" description="Nominee information">
          <TextField label="Name" value={form.nominee?.name} onChange={(e) => set('nominee.name', e.target.value)} error={formErrors['nominee.name']} required />
          <Select label="Relationship" value={form.nominee?.relationship} onChange={(e) => set('nominee.relationship', e.target.value)} options={RELATIONSHIPS.map((r) => ({ value: r, label: r }))} required />
          <TextField label="Mobile" value={form.nominee?.mobileNumber} onChange={(e) => set('nominee.mobileNumber', e.target.value)} error={formErrors['nominee.mobileNumber']} maxLength={10} required />
          <TextField label="Bank Account" value={form.nominee?.bankAccountNumber} onChange={(e) => set('nominee.bankAccountNumber', e.target.value)} />
          <AddrFields prefix="nominee" form={form} set={set} formErrors={formErrors} />
        </Section>

        <Section number="03" title="Guarantor" description="Guarantor information">
          <TextField label="Name" value={form.guarantor?.name} onChange={(e) => set('guarantor.name', e.target.value)} error={formErrors['guarantor.name']} required />
          <TextField label="Father/Husband Name" value={form.guarantor?.fatherOrHusbandName} onChange={(e) => set('guarantor.fatherOrHusbandName', e.target.value)} required />
          <Select label="Relationship" value={form.guarantor?.relationship} onChange={(e) => set('guarantor.relationship', e.target.value)} options={RELATIONSHIPS.map((r) => ({ value: r, label: r }))} required />
          <TextField label="Mobile" value={form.guarantor?.mobileNumber} onChange={(e) => set('guarantor.mobileNumber', e.target.value)} error={formErrors['guarantor.mobileNumber']} maxLength={10} required />
          <TextField label="Bank Account" value={form.guarantor?.bankAccountNumber} onChange={(e) => set('guarantor.bankAccountNumber', e.target.value)} />
          <AddrFields prefix="guarantor" form={form} set={set} formErrors={formErrors} />
        </Section>

        {form.coApplicant && (
          <Section number="04" title="Co-Applicant" description="Co-applicant details">
            <TextField label="Full Name" value={form.coApplicant.fullName} onChange={(e) => set('coApplicant.fullName', e.target.value)} error={formErrors['coApplicant.fullName']} required />
            <TextField label="Father/Husband Name" value={form.coApplicant.fatherOrHusbandName} onChange={(e) => set('coApplicant.fatherOrHusbandName', e.target.value)} required />
            <TextField label="Mobile" value={form.coApplicant.mobileNumber} onChange={(e) => set('coApplicant.mobileNumber', e.target.value)} error={formErrors['coApplicant.mobileNumber']} maxLength={10} required />
            <TextField label="Email" type="email" value={form.coApplicant.email} onChange={(e) => set('coApplicant.email', e.target.value)} />
            <AddrFields prefix="coApplicant" form={form} set={set} formErrors={formErrors} />
          </Section>
        )}

        <div className="form-footer">
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(detailPath)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </div>
      </form>
      <Snackbar />
    </div>
  )
}

export default EditLoan
