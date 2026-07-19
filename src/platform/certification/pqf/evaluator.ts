import { ReleaseManifest } from '../types';
import { QualificationProfile, QualificationReport, QualificationStatus } from './types';
import { EvidenceBundle, EvidenceCategory } from '../evidence-provider';

export class PlatformQualificationEvaluator {
  private profiles: QualificationProfile[] = [];

  public registerProfile(profile: QualificationProfile): void {
    this.profiles.push(profile);
  }

  public evaluate(
    manifest: ReleaseManifest,
    bundles: EvidenceBundle[] = [],
    gateRequiredCategories?: EvidenceCategory[]
  ): QualificationReport {
    const report: QualificationReport = {
      timestamp: new Date().toISOString(),
      manifestVersion: manifest.version,
      profilesEvaluated: {}
    };

    const presentCategories = new Set<EvidenceCategory>(bundles.map(b => b.category));

    for (const profile of this.profiles) {
      const missingCapabilities: string[] = [];
      const missingEvidenceCategories: EvidenceCategory[] = [];
      const warnings: string[] = [];
      let status: QualificationStatus = 'PASS';

      // Check minimum health score
      if (manifest.platformHealth.overall < profile.minimumHealthScore) {
        status = 'FAIL';
        warnings.push(`Overall health score ${manifest.platformHealth.overall} is below minimum required ${profile.minimumHealthScore}`);
      }

      // Check required capabilities
      for (const req of profile.requiredCapabilities) {
        if (!manifest.capabilities.includes(req.id)) {
          missingCapabilities.push(req.name);
          if (req.critical) {
            status = 'FAIL';
          } else if (status === 'PASS') {
            status = 'WARNING';
          }
        }
      }

      // Check required evidence categories
      if (profile.requiredEvidenceCategories) {
        for (const cat of profile.requiredEvidenceCategories) {
          if (!presentCategories.has(cat)) {
            missingEvidenceCategories.push(cat);
            const isGateRequired = !gateRequiredCategories || gateRequiredCategories.includes(cat);
            if (isGateRequired) {
              status = 'FAIL';
              warnings.push(`Required evidence category "${cat}" is missing from the qualification run.`);
            } else {
              if (status === 'PASS') {
                status = 'WARNING';
              }
              warnings.push(`Evidence category "${cat}" was not collected in this gate run (expected in full production qualification).`);
            }
          }
        }
      }

      report.profilesEvaluated[profile.id] = {
        status,
        score: manifest.platformHealth.overall,
        missingCapabilities,
        missingEvidenceCategories,
        warnings
      };
    }

    return report;
  }
}

