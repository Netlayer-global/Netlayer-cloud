import { useQuery } from '@tanstack/react-query'
import { Download, FileMinus } from 'lucide-react'
import { adminCreditNotesAPI } from '../../api/endpoints'
import { formatCurrency } from '../../lib/utils'

export default function CreditNotesAdmin() {
  const { data: cns = [], isLoading } = useQuery({
    queryKey: ['admin', 'credit-notes'],
    queryFn: () => adminCreditNotesAPI.list().then((r) => r.data.data),
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Credit notes</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Sequentially numbered credit notes issued for refunds and adjustments.
        </p>
      </div>

      {isLoading ? (
        <Card>Loading…</Card>
      ) : cns.length === 0 ? (
        <Card>
          <FileMinus size={20} className="mx-auto mb-2 text-[#6a6a68]" />
          <p className="text-sm text-[#a0a09e]">No credit notes issued yet.</p>
        </Card>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['CN Number', 'Against invoice', 'Customer', 'Amount', 'Reason', 'Issued', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cns.map((cn) => (
                <tr key={cn.id} className="border-t border-[#2a2b2a]">
                  <td className="px-4 py-3 font-mono text-xs text-[#e8e8e6]">{cn.creditNoteNumber}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#a0a09e]">{cn.invoice.invoiceNumber}</td>
                  <td className="px-4 py-3 text-xs text-[#a0a09e]">{cn.user?.email}</td>
                  <td className="px-4 py-3 tabular-nums">{formatCurrency(cn.total, cn.currency)}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wide">{cn.reason}</td>
                  <td className="px-4 py-3 text-xs text-[#6a6a68]">{new Date(cn.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={adminCreditNotesAPI.pdfUrl(cn.id)}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#a0a09e] hover:text-[#e0fe56] cursor-pointer transition-colors"
                    >
                      <Download size={12} /> PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">{children}</div>
}
