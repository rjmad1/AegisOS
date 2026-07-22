import json
import os

with open('retained_caps.json', 'r') as f:
    caps = json.load(f)

out_dir = r'D:\1_Projects\OpenClawOllamaLiteLLM_Transparency\src\platform\capability\providers'
os.makedirs(out_dir, exist_ok=True)

ts_code = [
    'import { CapabilityMetadata } from \"../types\";',
    'import { TenantContext } from \"../../core/storage/types\";',
    '',
    'export class LocalCapabilityProvider {',
    '  public readonly providerId = \"local-capability-provider\";',
    '',
    '  public async executeCapability(capabilityId: string, context: TenantContext, params?: any): Promise<any> {',
    '    switch (capabilityId) {'
]

for cap_id, cap_name in caps:
    method_name = 'execute' + ''.join(word.capitalize() for word in cap_id.replace('cap-', '').replace('-', ' ').split())
    ts_code.append(f'      case \"{cap_id}\":')
    ts_code.append(f'        return this.{method_name}(context, params);')

ts_code.append('      default:')
ts_code.append('        throw new Error(`Capability ${capabilityId} is not implemented by LocalCapabilityProvider.`);')
ts_code.append('    }')
ts_code.append('  }')
ts_code.append('')

for cap_id, cap_name in caps:
    method_name = 'execute' + ''.join(word.capitalize() for word in cap_id.replace('cap-', '').replace('-', ' ').split())
    ts_code.append(f'  private async {method_name}(context: TenantContext, params?: any): Promise<any> {{')
    ts_code.append(f'    // STUB IMPLEMENTATION for: {cap_name}')
    ts_code.append(f'    console.log(`Executing {cap_name} in local context for tenant ${{context.tenantId}}...`);')
    ts_code.append(f'    return {{ status: \"success\", capability: \"{cap_name}\", data: \"Stubbed local execution.\" }};')
    ts_code.append('  }')
    ts_code.append('')

ts_code.append('}')

with open(os.path.join(out_dir, 'LocalCapabilityProvider.ts'), 'w') as f:
    f.write('\n'.join(ts_code))

print('LocalCapabilityProvider.ts generated with', len(caps), 'stubs.')
