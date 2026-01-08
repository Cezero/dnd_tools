#!/bin/bash
# Executable version that sources into parent shell
# This uses a trick to source into the current shell context
exec bash -c "source /home/countzero/git/dnd_tools/.bashrc.local && exec bash"
