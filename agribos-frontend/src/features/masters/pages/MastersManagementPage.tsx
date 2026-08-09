import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mastersApi } from '../api/mastersApi';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { MapPin, Sprout, Fuel, Receipt } from 'lucide-react';

export const MastersManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'villages' | 'crops' | 'fuel' | 'expenses'>('villages');

  const { data: villages, isLoading: vLoading } = useQuery({
    queryKey: ['masters', 'villages'],
    queryFn: mastersApi.getVillages,
  });

  const { data: crops, isLoading: cLoading } = useQuery({
    queryKey: ['masters', 'crops'],
    queryFn: mastersApi.getCrops,
  });

  const { data: fuelStations, isLoading: fLoading } = useQuery({
    queryKey: ['masters', 'fuel'],
    queryFn: mastersApi.getFuelStations,
  });

  const { data: expenseCategories, isLoading: eLoading } = useQuery({
    queryKey: ['masters', 'expenses'],
    queryFn: mastersApi.getExpenseCategories,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Core Master Data Catalogs
        </h1>
        <p className="text-xs text-slate-500 mt-1">Villages, Crop Types, Fuel Stations, and Expense Categories</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('villages')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'villages' ? 'bg-agri-700 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Villages ({villages?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('crops')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'crops' ? 'bg-agri-700 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Crops ({crops?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('fuel')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'fuel' ? 'bg-agri-700 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Fuel Stations ({fuelStations?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'expenses' ? 'bg-agri-700 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expense Categories ({expenseCategories?.length || 0})</span>
        </button>
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="pt-6">
          {activeTab === 'villages' && (
            <div>
              <h2 className="text-sm font-bold mb-3">Registered Village Masters</h2>
              {vLoading ? <p className="text-xs text-slate-500">Loading villages...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Village Name</th>
                        <th className="p-2.5">Taluk</th>
                        <th className="p-2.5">District</th>
                        <th className="p-2.5">Pincode</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {villages?.map((v) => (
                        <tr key={v.id}>
                          <td className="p-2.5 font-mono text-agri-700">{v.villageCode}</td>
                          <td className="p-2.5 font-semibold">{v.villageName}</td>
                          <td className="p-2.5">{v.talukName}</td>
                          <td className="p-2.5">{v.districtName}</td>
                          <td className="p-2.5 font-mono">{v.pincode || 'N/A'}</td>
                          <td className="p-2.5"><Badge variant="success">ACTIVE</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'crops' && (
            <div>
              <h2 className="text-sm font-bold mb-3">Agricultural Crop Catalog</h2>
              {cLoading ? <p className="text-xs text-slate-500">Loading crops...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Crop Name</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Harvest Season</th>
                        <th className="p-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {crops?.map((c) => (
                        <tr key={c.id}>
                          <td className="p-2.5 font-mono text-agri-700">{c.cropCode}</td>
                          <td className="p-2.5 font-semibold">{c.cropName}</td>
                          <td className="p-2.5"><Badge variant="info">{c.category}</Badge></td>
                          <td className="p-2.5"><Badge variant="warning">{c.seasonName}</Badge></td>
                          <td className="p-2.5 text-slate-500">{c.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'fuel' && (
            <div>
              <h2 className="text-sm font-bold mb-3">Registered Fuel Station Bunks</h2>
              {fLoading ? <p className="text-xs text-slate-500">Loading fuel stations...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Station Name</th>
                        <th className="p-2.5">Address</th>
                        <th className="p-2.5">Contact Person</th>
                        <th className="p-2.5">Phone Number</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {fuelStations?.map((f) => (
                        <tr key={f.id}>
                          <td className="p-2.5 font-mono text-agri-700">{f.stationCode}</td>
                          <td className="p-2.5 font-semibold">{f.stationName}</td>
                          <td className="p-2.5 text-slate-500">{f.address}</td>
                          <td className="p-2.5">{f.contactPerson || 'N/A'}</td>
                          <td className="p-2.5 font-mono">{f.phoneNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <h2 className="text-sm font-bold mb-3">Enterprise Expense Categories</h2>
              {eLoading ? <p className="text-xs text-slate-500">Loading expense categories...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Category Name</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {expenseCategories?.map((e) => (
                        <tr key={e.id}>
                          <td className="p-2.5 font-mono text-agri-700">{e.categoryCode}</td>
                          <td className="p-2.5 font-semibold">{e.categoryName}</td>
                          <td className="p-2.5 text-slate-500">{e.description}</td>
                          <td className="p-2.5"><Badge variant="success">ACTIVE</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
