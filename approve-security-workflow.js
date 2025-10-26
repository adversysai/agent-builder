#!/usr/bin/env node

const https = require('https');

// Extract details from your data
const approvalId = 'approval_1761281065757_4pe1nrc';
const workflowId = 'workflow_1761280832171';
const threadId = 'thread_workflow_1761280832171_1761281065747';
const executionId = 'exec_1761281065368';

console.log('🔐 Approving security assessment workflow...');
console.log(`Approval ID: ${approvalId}`);
console.log(`Workflow ID: ${workflowId}`);

// Step 1: Approve the pending approval
async function approveWorkflow() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      action: 'approve',
      userId: 'system-approval'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/approval/${approvalId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Step 2: Resume the workflow
async function resumeWorkflow() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      threadId,
      executionId,
      resumeValue: { approved: true, status: 'approved' }
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/workflows/${workflowId}/resume`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Execute the approval process
async function main() {
  try {
    console.log('📝 Step 1: Approving the security assessment...');
    const approvalResult = await approveWorkflow();
    console.log('✅ Approval result:', approvalResult);

    if (approvalResult.success) {
      console.log('📝 Step 2: Resuming workflow execution...');
      const resumeResult = await resumeWorkflow();
      console.log('✅ Resume result:', resumeResult);
      console.log('🎉 Security assessment workflow approved and resumed!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Manual steps to approve:');
    console.log('1. Go to your workflow execution panel in the browser');
    console.log('2. Look for the approval request with the security warning');
    console.log('3. Click "Approve" to continue the security assessment');
    console.log('4. The workflow will then proceed with scraping and analysis');
  }
}

main();