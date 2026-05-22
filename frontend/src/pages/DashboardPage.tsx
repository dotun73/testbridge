const DashboardPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-6">Overview of your QA operations</p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Bugs', value: '0', color: 'text-red-500' },
          { label: 'Critical Bugs', value: '0', color: 'text-orange-500' },
          { label: 'Active Test Runs', value: '0', color: 'text-blue-500' },
          { label: 'Pass Rate', value: '0%', color: 'text-green-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage