port="${1:-2323}" # default

hugo server \
     --buildDrafts \
     --navigateToChanged \
     --port "${port}"