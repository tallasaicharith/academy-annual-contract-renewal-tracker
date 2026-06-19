const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('🧪 Starting API Verification Tests...');
  let token = '';
  let contractId = null;

  // 1. Auth: Signup
  try {
    const username = 'testuser_' + Date.now();
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email: `test_${Date.now()}@oxygensports.com`,
        password: 'password123',
        role: 'staff'
      })
    });
    const signupData = await signupRes.json();
    if (signupRes.status === 201 && signupData.token) {
      console.log('✅ TC-03: Signup with new user passed');
      token = signupData.token;
    } else {
      console.error('❌ TC-03 failed:', signupData);
    }
  } catch (err) {
    console.error('❌ TC-03 error:', err.message);
  }

  // 2. Auth: Login
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    const loginData = await loginRes.json();
    if (loginRes.status === 200 && loginData.token) {
      console.log('✅ TC-01: Login with valid credentials passed');
      token = loginData.token; // Use admin token for subsequent operations
    } else {
      console.error('❌ TC-01 failed:', loginData);
    }
  } catch (err) {
    console.error('❌ TC-01 error:', err.message);
  }

  // 3. Create Contract
  try {
    const contractRes = await fetch(`${BASE_URL}/contracts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        academyName: 'API Test Academy',
        equipmentCategories: 'Cricket, Football',
        contractValue: 450000,
        priceRevision: 4.5,
        relationshipManager: 'Ramesh Kumar',
        contractStartDate: '2026-06-01',
        renewalDate: '2027-06-01',
        status: 'Active',
        notes: 'Created via automated integration test'
      })
    });
    const contractData = await contractRes.json();
    if (contractRes.status === 201 && contractData.data) {
      console.log('✅ TC-05: Create contract with valid fields passed');
      contractId = contractData.data.id;
    } else {
      console.error('❌ TC-05 failed:', contractData);
    }
  } catch (err) {
    console.error('❌ TC-05 error:', err.message);
  }

  // 4. Get Dashboard Summary
  try {
    const dashboardRes = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dashboardData = await dashboardRes.json();
    if (dashboardRes.status === 200 && dashboardData.totalContracts > 0) {
      console.log('✅ TC-09: Dashboard summary counts passed');
    } else {
      console.error('❌ TC-09 failed:', dashboardData);
    }
  } catch (err) {
    console.error('❌ TC-09 error:', err.message);
  }

  // 5. Update Contract & Verify Audit Log
  if (contractId) {
    try {
      const updateRes = await fetch(`${BASE_URL}/contracts/${contractId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          academyName: 'API Test Academy Updated',
          equipmentCategories: 'Cricket, Football, Tennis',
          contractValue: 500000,
          priceRevision: 5.0,
          relationshipManager: 'Ramesh Kumar',
          contractStartDate: '2026-06-01',
          renewalDate: '2027-06-01',
          status: 'Active',
          notes: 'Updated via automated integration test'
        })
      });
      const updateData = await updateRes.json();
      if (updateRes.status === 200 && updateData.data) {
        console.log('✅ TC-18: Edit contract value passed');
      } else {
        console.error('❌ TC-18 failed:', updateData);
      }
    } catch (err) {
      console.error('❌ TC-18 error:', err.message);
    }

    // Verify Audit Logs via GET /api/contracts/:id
    try {
      const detailRes = await fetch(`${BASE_URL}/contracts/${contractId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const detailData = await detailRes.json();
      if (detailRes.status === 200 && detailData.auditHistory && detailData.auditHistory.length > 0) {
        console.log('✅ TC-17: View audit history passed');
      } else {
        console.error('❌ TC-17 failed:', detailData);
      }
    } catch (err) {
      console.error('❌ TC-17 error:', err.message);
    }

    // Verify separate history endpoint GET /api/contracts/:id/history
    try {
      const historyRes = await fetch(`${BASE_URL}/contracts/${contractId}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      if (historyRes.status === 200 && historyData.history && historyData.history.length > 0) {
        console.log('✅ Separate History Endpoint GET /api/contracts/:id/history passed');
      } else {
        console.error('❌ Separate History Endpoint failed:', historyData);
      }
    } catch (err) {
      console.error('❌ Separate History Endpoint error:', err.message);
    }
  }

  // 6. Reports Analytics Summary
  try {
    const reportsRes = await fetch(`${BASE_URL}/reports/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const reportsData = await reportsRes.json();
    if (reportsRes.status === 200 && reportsData.statusDistribution) {
      console.log('✅ TC-23: View status distribution analytics passed');
    } else {
      console.error('❌ TC-23 failed:', reportsData);
    }
  } catch (err) {
    console.error('❌ TC-23 error:', err.message);
  }

  // 7. Delete contract
  if (contractId) {
    try {
      const deleteRes = await fetch(`${BASE_URL}/contracts/${contractId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deleteData = await deleteRes.json();
      if (deleteRes.status === 200) {
        console.log('✅ Delete contract passed');
      } else {
        console.error('❌ Delete contract failed:', deleteData);
      }
    } catch (err) {
      console.error('❌ Delete contract error:', err.message);
    }
  }

  console.log('🧪 API Verification Tests Completed.');
}

runTests();
