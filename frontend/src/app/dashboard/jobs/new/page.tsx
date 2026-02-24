"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createJob, uploadJobSampleAudio, uploadJobSampleDocuments, uploadJobSampleImages, uploadJobSampleVideos } from "@/lib/api";
import { useState } from "react";
import Image from "next/image";
import { Badge, Button, Input, Select, Textarea } from "@/components/ui";
import JobCategoryPicker from "@/components/JobCategoryPicker";

export default function NewJobPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    overviewText: "",
    companyName: "",
    categoryId: "",
    workLocation: "Remote",
    engagementType: "PROJECT_BASED",
    deliverableType: "VIDEO_PRODUCTION",
    deliverableScopes: "",
    skills: "",
    industry: "",
    teamSize: "",
    budgetMin: "",
    budgetMax: "",
    currency: "USD",
    pricingModel: "FIXED_PRICE",
    slaDeliveryDays: "",
    includedRevisionRounds: "",
    qualityStandards: "",
    requiredFormats: "",
    minYearsExperience: "",
    requiredSkills: "",
    requiredTools: "",
    requiredQualifications: "",
    preferredExperience: "",
    requiresPortfolio: true,
    requiresReferences: false,
    minReferenceCount: "",
    requiresNDA: false,
    requiresBGCheck: false,
    requiresInsurance: false,
    complianceRequirements: "",
    dataClassifications: "",
    pilotProjectRequired: false,
    pilotProjectScope: "",
    pilotEstimatedHours: "",
    preferredVendorOpportunity: false,
    minimumMonthlyCommitment: "",
    contractTermMonths: "",
    rateStabilityGuarantee: false,
    closingDate: "",
    evaluationProcess: "",
    applicationGuidelineUrls: "",
    isEnterpriseOnly: true,
  });
  const [sampleDocuments, setSampleDocuments] = useState<File[]>([]);
  const [sampleImages, setSampleImages] = useState<File[]>([]);
  const [sampleVideos, setSampleVideos] = useState<File[]>([]);
  const [sampleAudio, setSampleAudio] = useState<File[]>([]);

  const parseList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const toNumber = (value: string) => (value.trim() === "" ? undefined : Number(value));

  const mutation = useMutation({
    mutationFn: async () => {
      const [documentUrls, imageUrls, videoUrls, audioUrls] = await Promise.all([
        uploadJobSampleDocuments(sampleDocuments),
        uploadJobSampleImages(sampleImages),
        uploadJobSampleVideos(sampleVideos),
        uploadJobSampleAudio(sampleAudio),
      ]);

      return createJob({
        title: form.title,
        description: form.description,
        overviewText: form.overviewText || undefined,
        companyName: form.companyName || undefined,
        categoryId: form.categoryId || undefined,
        workLocation: form.workLocation || undefined,
        engagementType: form.engagementType,
        deliverableType: form.deliverableType,
        deliverableScopes: parseList(form.deliverableScopes),
        skills: parseList(form.skills),
        industry: parseList(form.industry),
        teamSize: parseList(form.teamSize),
        budgetMin: toNumber(form.budgetMin),
        budgetMax: toNumber(form.budgetMax),
        currency: form.currency || undefined,
        pricingModel: form.pricingModel,
        slaDeliveryDays: toNumber(form.slaDeliveryDays),
        includedRevisionRounds: toNumber(form.includedRevisionRounds),
        qualityStandards: parseList(form.qualityStandards),
        requiredFormats: parseList(form.requiredFormats),
        minYearsExperience: toNumber(form.minYearsExperience),
        requiredSkills: parseList(form.requiredSkills),
        requiredTools: parseList(form.requiredTools),
        requiredQualifications: parseList(form.requiredQualifications),
        preferredExperience: parseList(form.preferredExperience),
        requiresPortfolio: form.requiresPortfolio,
        requiresReferences: form.requiresReferences,
        minReferenceCount: toNumber(form.minReferenceCount),
        requiresNDA: form.requiresNDA,
        requiresBGCheck: form.requiresBGCheck,
        requiresInsurance: form.requiresInsurance,
        complianceRequirements: parseList(form.complianceRequirements),
        dataClassifications: parseList(form.dataClassifications),
        pilotProjectRequired: form.pilotProjectRequired,
        pilotProjectScope: form.pilotProjectScope || undefined,
        pilotEstimatedHours: toNumber(form.pilotEstimatedHours),
        preferredVendorOpportunity: form.preferredVendorOpportunity,
        minimumMonthlyCommitment: toNumber(form.minimumMonthlyCommitment),
        contractTermMonths: toNumber(form.contractTermMonths),
        rateStabilityGuarantee: form.rateStabilityGuarantee,
        closingDate: form.closingDate ? new Date(form.closingDate).toISOString() : undefined,
        evaluationProcess: form.evaluationProcess || undefined,
        applicationGuidelineUrls: parseList(form.applicationGuidelineUrls),
        sampleDocumentUrls: documentUrls,
        sampleImageUrls: imageUrls,
        sampleVideoUrls: videoUrls,
        sampleAudioUrls: audioUrls,
        isEnterpriseOnly: form.isEnterpriseOnly,
      });
    },
    onSuccess: (job) => router.push(`/dashboard/jobs/${job.id}`),
  });

  const isInvalid = !form.title.trim() || !form.description.trim();

  return (
    <main className="relative mx-auto max-w-4xl p-6 pb-12">
      <div className="absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/images/backgrounds/geo-light-grid.svg')" }} />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.22),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(167,139,250,0.22),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(16,185,129,0.18),transparent_35%)]" />

      <header className="mb-6 rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/30 bg-white/60 shadow-inner">
            <Image src="/images/badges/info.png" alt="info badge" fill className="object-contain" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Post a Job</h1>
              <Badge variant="info" className="bg-sky-50/80 text-sky-700">Enterprise-grade</Badge>
              <Badge variant="success" className="bg-emerald-50/80 text-emerald-700">Real API</Badge>
            </div>
            <p className="text-slate-700">Capture detailed requirements to attract qualified freelancers and vendor teams.</p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur">
        <div className="space-y-8">
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Basics</h2>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Role title or project headline"
            />
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={6}
              placeholder="Describe the work, scope, success criteria, and constraints."
            />
            <Textarea
              value={form.overviewText}
              onChange={(e) => setForm({ ...form, overviewText: e.target.value })}
              rows={3}
              placeholder="Short overview for quick scanning (optional)"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Company name"
              />
              <JobCategoryPicker
                value={form.categoryId}
                onChange={(next) => setForm({ ...form, categoryId: next })}
                placeholder="Select a category"
                helperText="Pick the closest specialization — used for marketplace discovery."
              />
            </div>
          </div>

          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Engagement</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                value={form.engagementType}
                onChange={(e) => setForm({ ...form, engagementType: e.target.value })}
              >
                <option value="PROJECT_BASED">Project-based</option>
                <option value="CONTRACT">Contract</option>
                <option value="LONG_TERM_PARTNERSHIP">Long-term partnership</option>
                <option value="RETAINER">Retainer</option>
              </Select>
              <Select
                value={form.deliverableType}
                onChange={(e) => setForm({ ...form, deliverableType: e.target.value })}
              >
                <option value="IMAGE_DESIGN">Image design</option>
                <option value="VIDEO_PRODUCTION">Video production</option>
                <option value="AUDIO_PRODUCTION">Audio production</option>
                <option value="DOCUMENT_DEVELOPMENT">Document development</option>
                <option value="MIXED">Mixed media</option>
              </Select>
            </div>
            <Input
              value={form.deliverableScopes}
              onChange={(e) => setForm({ ...form, deliverableScopes: e.target.value })}
              placeholder="Deliverable scopes (comma separated)"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                value={form.workLocation}
                onChange={(e) => setForm({ ...form, workLocation: e.target.value })}
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
                <option value="Global">Global</option>
              </Select>
              <Input
                value={form.teamSize}
                onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                placeholder="Team size fit (comma separated)"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Budget & SLA</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                type="number"
                value={form.budgetMin}
                onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                placeholder="Budget min"
              />
              <Input
                type="number"
                value={form.budgetMax}
                onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                placeholder="Budget max"
              />
              <Input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="Currency (e.g., USD)"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Select
                value={form.pricingModel}
                onChange={(e) => setForm({ ...form, pricingModel: e.target.value })}
              >
                <option value="FIXED_PRICE">Fixed price</option>
                <option value="HOURLY">Hourly</option>
                <option value="RETAINER">Retainer</option>
                <option value="VOLUME_BASED">Volume based</option>
              </Select>
              <Input
                type="number"
                value={form.slaDeliveryDays}
                onChange={(e) => setForm({ ...form, slaDeliveryDays: e.target.value })}
                placeholder="SLA delivery days"
              />
              <Input
                type="number"
                value={form.includedRevisionRounds}
                onChange={(e) => setForm({ ...form, includedRevisionRounds: e.target.value })}
                placeholder="Included revisions"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Skills & Requirements</h2>
            <Input
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="Key skills (comma separated)"
            />
            <Input
              value={form.requiredSkills}
              onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
              placeholder="Required skills (comma separated)"
            />
            <Input
              value={form.requiredTools}
              onChange={(e) => setForm({ ...form, requiredTools: e.target.value })}
              placeholder="Required tools (comma separated)"
            />
            <Input
              value={form.requiredQualifications}
              onChange={(e) => setForm({ ...form, requiredQualifications: e.target.value })}
              placeholder="Required qualifications (comma separated)"
            />
            <Input
              value={form.preferredExperience}
              onChange={(e) => setForm({ ...form, preferredExperience: e.target.value })}
              placeholder="Preferred experience (comma separated)"
            />
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                type="number"
                value={form.minYearsExperience}
                onChange={(e) => setForm({ ...form, minYearsExperience: e.target.value })}
                placeholder="Min years experience"
              />
              <Input
                type="number"
                value={form.minReferenceCount}
                onChange={(e) => setForm({ ...form, minReferenceCount: e.target.value })}
                placeholder="Reference count"
              />
              <Input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Industries (comma separated)"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                value={form.qualityStandards}
                onChange={(e) => setForm({ ...form, qualityStandards: e.target.value })}
                placeholder="Quality standards (comma separated)"
              />
              <Input
                value={form.requiredFormats}
                onChange={(e) => setForm({ ...form, requiredFormats: e.target.value })}
                placeholder="Required formats (comma separated)"
              />
              <Input
                value={form.complianceRequirements}
                onChange={(e) => setForm({ ...form, complianceRequirements: e.target.value })}
                placeholder="Compliance requirements (comma separated)"
              />
            </div>
            <Input
              value={form.dataClassifications}
              onChange={(e) => setForm({ ...form, dataClassifications: e.target.value })}
              placeholder="Data classifications (comma separated)"
            />
          </div>

          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Enterprise Controls</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.requiresPortfolio}
                  onChange={(e) => setForm({ ...form, requiresPortfolio: e.target.checked })}
                />
                Requires portfolio
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.requiresReferences}
                  onChange={(e) => setForm({ ...form, requiresReferences: e.target.checked })}
                />
                Requires references
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.requiresNDA}
                  onChange={(e) => setForm({ ...form, requiresNDA: e.target.checked })}
                />
                NDA required
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.requiresBGCheck}
                  onChange={(e) => setForm({ ...form, requiresBGCheck: e.target.checked })}
                />
                Background check
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.requiresInsurance}
                  onChange={(e) => setForm({ ...form, requiresInsurance: e.target.checked })}
                />
                Insurance required
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isEnterpriseOnly}
                  onChange={(e) => setForm({ ...form, isEnterpriseOnly: e.target.checked })}
                />
                Enterprise-only listing
              </label>
            </div>
          </div>

          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Pilot & Vendor Fit</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.pilotProjectRequired}
                  onChange={(e) => setForm({ ...form, pilotProjectRequired: e.target.checked })}
                />
                Pilot required
              </label>
              <Input
                value={form.pilotProjectScope}
                onChange={(e) => setForm({ ...form, pilotProjectScope: e.target.value })}
                placeholder="Pilot scope"
              />
              <Input
                type="number"
                value={form.pilotEstimatedHours}
                onChange={(e) => setForm({ ...form, pilotEstimatedHours: e.target.value })}
                placeholder="Pilot hours"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.preferredVendorOpportunity}
                  onChange={(e) => setForm({ ...form, preferredVendorOpportunity: e.target.checked })}
                />
                Preferred vendor opportunity
              </label>
              <Input
                type="number"
                value={form.minimumMonthlyCommitment}
                onChange={(e) => setForm({ ...form, minimumMonthlyCommitment: e.target.value })}
                placeholder="Minimum monthly commitment"
              />
              <Input
                type="number"
                value={form.contractTermMonths}
                onChange={(e) => setForm({ ...form, contractTermMonths: e.target.value })}
                placeholder="Contract term (months)"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.rateStabilityGuarantee}
                onChange={(e) => setForm({ ...form, rateStabilityGuarantee: e.target.checked })}
              />
              Rate stability guarantee
            </label>
          </div>

          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Application & Timeline</h2>
            <Textarea
              value={form.evaluationProcess}
              onChange={(e) => setForm({ ...form, evaluationProcess: e.target.value })}
              rows={3}
              placeholder="Evaluation process and decision workflow"
            />
            <Input
              value={form.applicationGuidelineUrls}
              onChange={(e) => setForm({ ...form, applicationGuidelineUrls: e.target.value })}
              placeholder="Application guideline URLs (comma separated)"
            />
            <Input
              type="date"
              value={form.closingDate}
              onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
            />
          </div>

          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Samples & References</h2>
            <p className="text-sm text-slate-600">
              Select files to upload as samples. These will be attached to the job after upload.
            </p>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Documents</label>
              <p className="text-xs text-slate-500">PDF, DOCX, PPTX, XLSX. Select one or more documents.</p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
                onChange={(e) => setSampleDocuments(Array.from(e.target.files ?? []))}
                className="w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-2.5 text-sm"
              />
              {sampleDocuments.length > 0 && (
                <p className="text-xs text-slate-600">{sampleDocuments.length} document(s) selected</p>
              )}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Images</label>
              <p className="text-xs text-slate-500">PNG, JPG, JPEG, WEBP. Select one or more images.</p>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setSampleImages(Array.from(e.target.files ?? []))}
                className="w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-2.5 text-sm"
              />
              {sampleImages.length > 0 && (
                <p className="text-xs text-slate-600">{sampleImages.length} image(s) selected</p>
              )}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Videos</label>
              <p className="text-xs text-slate-500">MP4, MOV. Select one or more videos.</p>
              <input
                type="file"
                multiple
                accept="video/mp4,video/quicktime"
                onChange={(e) => setSampleVideos(Array.from(e.target.files ?? []))}
                className="w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-2.5 text-sm"
              />
              {sampleVideos.length > 0 && (
                <p className="text-xs text-slate-600">{sampleVideos.length} video(s) selected</p>
              )}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Audio</label>
              <p className="text-xs text-slate-500">MP3, WAV. Select one or more audio files.</p>
              <input
                type="file"
                multiple
                accept="audio/mpeg,audio/wav"
                onChange={(e) => setSampleAudio(Array.from(e.target.files ?? []))}
                className="w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-2.5 text-sm"
              />
              {sampleAudio.length > 0 && (
                <p className="text-xs text-slate-600">{sampleAudio.length} audio file(s) selected</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || isInvalid}>
              Create enterprise draft
            </Button>
            {mutation.isPending && <span className="text-sm text-slate-600">Creating…</span>}
            {mutation.isError && <span className="text-sm text-rose-600">Failed to create.</span>}
          </div>
          <p className="text-xs text-slate-500">Drafts are created via the real backend API. Publish from the job detail view when ready.</p>
        </div>
      </section>
    </main>
  );
}
