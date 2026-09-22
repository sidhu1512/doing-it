!macro customInstall
  CreateShortCut "$SMPROGRAMS\Uninstall Doing It.lnk" "$INSTDIR\Uninstall Doing It.exe" "" "$INSTDIR\Uninstall Doing It.exe" 0
!macroend

!macro customUnInit
  RMDir /r "$APPDATA\Doing It"
  RMDir /r "$APPDATA\doing-it"
  RMDir /r "$LOCALAPPDATA\doing-it"
  RMDir /r "$LOCALAPPDATA\doing-it-updater"
!macroend

!macro customRemoveFiles
  Delete "$SMPROGRAMS\Uninstall Doing It.lnk"
  Delete "$DESKTOP\Doing It.lnk"
!macroend
