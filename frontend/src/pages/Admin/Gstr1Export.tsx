import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { gstr1API } from '../../api/endpoints'

export default function Gstr1Export() {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">GSTR-1 export</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Download a CSV of all invoices and credit notes for a given month, ready for upload to the GSTN portal or your accountant.
        </p>
      </div>

      <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-[#e0fe56]" />
          <h3 className="text-base font-medium text-[#e8e8e6]">Select period</h3>
        </div>
        <p className="text-xs text-[#a0a09e] mb-5">
          The CSV is split into B2B (registered customers with GSTIN), B2CS (consumers, no GSTIN), Export (foreign customers, zero-rated), and CDNR (credit notes).
        </p>

        <div className="flex gap-2 max-w-sm">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="font-mono"
          />
          <a
            href={gstr1API.exportUrl(month)}
            download={`GSTR1-${month}.csv`}
            target="_blank"
            rel="noreferrer"
          >
            <Button>
              <Download size={14} className="mr-1.5" /> Download
            </Button>
          </a>
        </div>

        <div className="mt-6 bg-[#161716] border border-[#2a2b2a] rounded-md p-4 text-xs text-[#a0a09e]">
          <strong className="text-[#e8e8e6]">Note:</strong> This export is in CSV format compatible with the GSTN offline tool. For direct API filing
          (mandatory for businesses with annual turnover &gt; ₹5Cr), contact us to enable e-Invoice / IRN integration.
        </div>
      </div>
    </div>
  )
}
