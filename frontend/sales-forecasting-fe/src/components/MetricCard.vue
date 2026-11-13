<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  badgeText: {
    type: String,
    default: ''
  },
  badgeType: {
    type: String,
    default: 'neutral', // 'positive', 'negative', 'neutral', 'indigo'
    validator: (val) => ['positive', 'negative', 'neutral', 'indigo'].includes(val)
  },
  colorScheme: {
    type: String,
    default: 'indigo', // 'indigo', 'emerald', 'blue', 'amber', 'purple'
  }
})

const colorClasses = {
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    borderHover: 'hover:border-indigo-300'
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    borderHover: 'hover:border-emerald-300'
  },
  blue: {
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    borderHover: 'hover:border-blue-300'
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    borderHover: 'hover:border-amber-300'
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    borderHover: 'hover:border-purple-300'
  }
}

const badgeClasses = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negative: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200'
}
</script>

<template>
  <div
    class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
    :class="colorClasses[colorScheme]?.borderHover || 'hover:border-indigo-300'"
  >
    <div class="flex items-start justify-between mb-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          {{ title }}
        </p>
        <h3 class="text-2xl font-bold text-slate-900 tracking-tight">
          {{ value }}
        </h3>
      </div>
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-200 hover:scale-105"
        :class="colorClasses[colorScheme]?.iconBg || 'bg-indigo-50 text-indigo-600 border-indigo-100'"
      >
        <slot name="icon" />
      </div>
    </div>

    <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
      <span class="text-slate-500 truncate" :title="subtitle">
        {{ subtitle }}
      </span>
      <span
        v-if="badgeText"
        class="px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center space-x-1 shrink-0 ml-2"
        :class="badgeClasses[badgeType] || badgeClasses.neutral"
      >
        {{ badgeText }}
      </span>
    </div>
  </div>
</template>

