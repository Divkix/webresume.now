'use client'

import { getAllRoleTemplates } from '@/lib/onboarding/role-templates'
import * as Icons from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Step1RoleProps {
  onSelect: (roleId: string) => void
}

/**
 * Step 1: Role Selection Component
 * Displays a grid of career stage options for the user to choose from
 */
export function Step1Role({ onSelect }: Step1RoleProps) {
  const roles = getAllRoleTemplates()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
          Let&apos;s Complete Your Profile
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Tell us about your career stage so we can tailor your resume to highlight your strengths.
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          // Dynamically get the icon component from lucide-react
          const IconComponent = Icons[role.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>

          return (
            <Card
              key={role.id}
              onClick={() => onSelect(role.id)}
              className="group cursor-pointer border-2 border-slate-200/60 hover:border-indigo-600 shadow-depth-sm hover:shadow-depth-lg transition-all duration-300 bg-white p-6 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                {/* Icon Container */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
                  <div className="relative bg-gradient-to-r from-indigo-100 to-blue-100 p-3 rounded-xl group-hover:from-indigo-200 group-hover:to-blue-200 transition-colors">
                    {IconComponent && (
                      <IconComponent className="w-6 h-6 text-indigo-600" />
                    )}
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                    {role.label}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-slate-500 font-medium">
          Don&apos;t worry, you can always edit your profile later.
        </p>
      </div>
    </div>
  )
}
