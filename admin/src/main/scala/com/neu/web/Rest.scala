package com.neu.web

import com.neu.api.Api
import com.neu.core.BootedCore
import com.neu.core.Core
import com.neu.core.CoreActors

object Rest extends App with BootedCore with Core with CoreActors with Api with StaticResources
