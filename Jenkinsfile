@Library('pipeline-library@webapp-pipelines') _

webappPipeline {
    slaveLabel = 'dev'
    nodeVersion = '10.16.2'
    useArtifactoryRepo = false
    projectName = 'webrtc-troubleshoot'
    manifest = staticManifest(['webrtc-troubleshooter.js', 'webrtc-troubleshooter.js.map'])
    buildType = { env.BRANCH_NAME == 'master' ? 'MAINLINE' : 'FEATURE' }
    publishPackage = { 'prod' }
    testJob = 'valve-webrtc-troubleshoot-tests'

    buildStep = {
        sh('npm i && npm test && npm run build')
    }

    cmConfig = {
        return [
            managerEmail: 'purecloud-client-media@genesys.com',
            rollbackPlan: 'Patch version with fix',
            testResults: 'https://jenkins.ininica.com/job/web-pipeline-webrtc-troubleshoot/job/master/'
        ]
    }

    shouldTagOnRelease = { true }

    postReleaseStep = {
        sh("""
            # patch to prep for the next version
            npm version patch --no-git-tag-version
            git commit -am "Prep next version"
            git push origin HEAD:master --tags
        """)
    }
}